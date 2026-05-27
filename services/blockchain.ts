import { ethers } from 'ethers';
import { CONFIG } from '../config';
import KYCRegistryArtifact from './abis/KYCRegistry.json';
import SupplyChainEscrowArtifact from './abis/SupplyChainEscrow.json';
import MarketplaceContractArtifact from './abis/MarketplaceContract.json';
import { UserProfile, Shipment, KYCStatus, UserRole, ShipmentStatus, Notification, PaymentStatus, MarketplaceItem } from '../types';

// Types for Window.ethereum
declare global {
  interface Window {
    ethereum: any;
  }
}

// --- Helpers ---

const getProvider = () => {
  if (!window.ethereum) throw new Error("No crypto wallet found. Please install MetaMask.");
  return new ethers.BrowserProvider(window.ethereum);
};

const getSigner = async () => {
  const provider = getProvider();
  return await provider.getSigner();
};

const getContract = async (address: string, abi: any, withSigner = false) => {
  if (withSigner) {
    const signer = await getSigner();
    return new ethers.Contract(address, abi, signer);
  }
  const provider = getProvider();
  return new ethers.Contract(address, abi, provider);
};

// --- Auth & Wallet ---

export const connectWallet = async (): Promise<string> => {
  const provider = getProvider();
  const accounts = await provider.send("eth_requestAccounts", []);

  // Switch to Sepolia if needed
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0x' + CONFIG.SEPOLIA_CHAIN_ID.toString(16) }],
    });
  } catch (switchError: any) {
    // This error code indicates that the chain has not been added to MetaMask.
    if (switchError.code === 4902) {
      // Add Sepolia (usually exists by default, but good practice)
      // For now, we assume user has Sepolia or can add it manually if this fails
      console.warn("Sepolia network not found in wallet");
    }
  }

  return accounts[0];
};

export const getBalance = async (walletAddress: string): Promise<number> => {
  const provider = getProvider();
  const balance = await provider.getBalance(walletAddress);
  return parseFloat(ethers.formatEther(balance));
};

// --- KYC Registry ---

export const getUserProfile = async (walletAddress: string): Promise<UserProfile | null> => {
  try {
    const contract = await getContract(CONFIG.KYC_CONTRACT_ADDRESS, KYCRegistryArtifact.abi);

    // Check if admin first (fallback/override)
    let isAdmin = false;
    try {
      isAdmin = await contract.isAdmin(walletAddress);
    } catch (e) {
      console.warn("Failed to check isAdmin", e);
    }

    const profile = await contract.getUserProfile(walletAddress);

    if (!profile.exists) {
      // If not in registry but IS an admin, return a mock admin profile.
      if (isAdmin) {
        return {
          walletAddress: walletAddress,
          name: "Admin",
          email: "admin@chainflow.com",
          role: UserRole.ADMIN,
          kycStatus: KYCStatus.VERIFIED
        };
      }
      return null;
    }

    // Force role to ADMIN if contract says so
    const role = isAdmin ? UserRole.ADMIN : Number(profile.role) as UserRole;

    // Fetch off-chain data (simulated)
    const storedData = localStorage.getItem(`chainflow_user_data_${walletAddress.toLowerCase()}`);
    const offChainProfile = storedData ? JSON.parse(storedData) : {};

    return {
      walletAddress: walletAddress,
      name: profile.name,
      email: profile.email,
      role: role,
      kycStatus: Number(profile.kycStatus) as KYCStatus,
      // Merge off-chain data
      phone: offChainProfile.phone,
      address: offChainProfile.address,
      kycDocuments: offChainProfile.kycDocuments
    } as UserProfile;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
};

export const registerUser = async (profile: UserProfile, onTxHash?: (hash: string) => void): Promise<UserProfile> => {
  const contract = await getContract(CONFIG.KYC_CONTRACT_ADDRESS, KYCRegistryArtifact.abi, true);
  const tx = await contract.submitKYC(profile.name, profile.email);
  if (onTxHash) onTxHash(tx.hash);

  // Save extended details to LocalStorage (Phone, Address, Docs)
  const offChainData = {
    phone: profile.phone,
    address: profile.address,
    kycDocuments: profile.kycDocuments
  };
  localStorage.setItem(`chainflow_user_data_${profile.walletAddress.toLowerCase()}`, JSON.stringify(offChainData));

  await tx.wait();
  return profile;
};

// --- Shipments (Escrow) ---

export const createShipment = async (shipmentData: Omit<Shipment, 'id' | 'status' | 'createdAt' | 'history' | 'paymentStatus'>): Promise<Shipment> => {
  const contract = await getContract(CONFIG.ESCROW_CONTRACT_ADDRESS, SupplyChainEscrowArtifact.abi, true);

  const priceInWei = ethers.parseEther(shipmentData.price.toString());

  const tx = await contract.createShipment(
    shipmentData.receiver,
    shipmentData.courier,
    shipmentData.title,
    shipmentData.description,
    shipmentData.category,
    { value: priceInWei }
  );

  const receipt = await tx.wait();

  return {
    ...shipmentData,
    id: "PENDING_CONFIRMATION", // In a real app, parse logs for ID
    status: ShipmentStatus.PENDING,
    paymentStatus: PaymentStatus.LOCKED,
    createdAt: Date.now(),
    history: []
  } as Shipment;
};

export const getAllShipments = async (): Promise<Shipment[]> => {
  try {
    const contract = await getContract(CONFIG.ESCROW_CONTRACT_ADDRESS, SupplyChainEscrowArtifact.abi);
    const shipmentIds = await contract.getAllShipments();

    const shipments: Shipment[] = [];

    for (const id of shipmentIds) {
      const s = await contract.getShipment(id);
      if (s.exists) {
        shipments.push({
          id: s.id.toString(),
          sender: s.sender,
          receiver: s.receiver,
          courier: s.courier,
          title: s.title,
          description: s.description,
          category: s.category,
          price: parseFloat(ethers.formatEther(s.price)),
          status: Number(s.status) as ShipmentStatus,
          paymentStatus: Number(s.paymentStatus) as PaymentStatus,
          createdAt: Number(s.createdAt) * 1000,
          deliveryDate: s.deliveredAt > 0 ? new Date(Number(s.deliveredAt) * 1000).toISOString() : undefined,
          history: []
        });
      }
    }
    return shipments;
  } catch (error) {
    console.error("Error fetching shipments:", error);
    return [];
  }
};

export const updateShipmentStatus = async (id: string, status: ShipmentStatus, location: string, message: string): Promise<void> => {
  const contract = await getContract(CONFIG.ESCROW_CONTRACT_ADDRESS, SupplyChainEscrowArtifact.abi, true);
  const tx = await contract.updateShipmentStatus(id, status, location, message);
  await tx.wait();
};

// --- Marketplace ---

export const getMarketplaceItems = async (): Promise<MarketplaceItem[]> => {
  try {
    const contract = await getContract(CONFIG.MARKETPLACE_CONTRACT_ADDRESS, MarketplaceContractArtifact.abi);
    const items = await contract.getAllItems();

    return items.filter((i: any) => i.isAvailable).map((i: any) => ({
      id: i.id.toString(),
      title: i.title,
      description: i.description,
      price: parseFloat(ethers.formatEther(i.price)),
      category: i.category,
      image: i.imageURI,
      seller: i.seller,
      isAvailable: i.isAvailable
    }));
  } catch (error) {
    console.error("Error fetching marketplace items:", error);
    return [];
  }
};

export const purchaseItem = async (item: MarketplaceItem, buyerAddress: string): Promise<void> => {
  const contract = await getContract(CONFIG.MARKETPLACE_CONTRACT_ADDRESS, MarketplaceContractArtifact.abi, true);
  const priceInWei = ethers.parseEther(item.price.toString());

  const tx = await contract.purchaseItem(item.id, { value: priceInWei });
  await tx.wait();
};

export const addMarketplaceItem = async (item: Omit<MarketplaceItem, 'id'>): Promise<void> => {
  const contract = await getContract(CONFIG.MARKETPLACE_CONTRACT_ADDRESS, MarketplaceContractArtifact.abi, true);
  const priceInWei = ethers.parseEther(item.price.toString());

  const tx = await contract.listItem(
    item.title,
    item.description,
    priceInWei,
    item.category,
    item.image || ""
  );
  await tx.wait();
};

export const deleteMarketplaceItem = async (id: string, sellerAddr: string): Promise<void> => {
  const contract = await getContract(CONFIG.MARKETPLACE_CONTRACT_ADDRESS, MarketplaceContractArtifact.abi, true);
  const tx = await contract.removeItem(id);
  await tx.wait();
};

// --- Notifications ---

const STORAGE_KEY_NOTIFICATIONS = 'chainflow_notifications';

export const getNotifications = (walletAddress: string): Notification[] => {
  const data = localStorage.getItem(STORAGE_KEY_NOTIFICATIONS);
  return data ? JSON.parse(data) : [];
};

export const createLocalNotification = (title: string, message: string, type: Notification['type']) => {
  const notes = getNotifications(""); // Get all
  notes.push({
    id: Math.random().toString(36).substr(2, 9),
    title,
    message,
    timestamp: Date.now(),
    read: false,
    type
  });
  localStorage.setItem(STORAGE_KEY_NOTIFICATIONS, JSON.stringify(notes));
};

// --- Admin ---

export const verifyKYC = async (walletAddress: string, status: KYCStatus): Promise<void> => {
  const contract = await getContract(CONFIG.KYC_CONTRACT_ADDRESS, KYCRegistryArtifact.abi, true);

  if (status === KYCStatus.VERIFIED) {
    // Default to BUYER role for now. In a real app, Admin might select the role.
    const tx = await contract.verifyKYC(walletAddress, UserRole.BUYER);
    await tx.wait();
  } else {
    const tx = await contract.rejectKYC(walletAddress, "Admin rejected");
    await tx.wait();
  }
};

export const getAllUsers = async (): Promise<UserProfile[]> => {
  try {
    const contract = await getContract(CONFIG.KYC_CONTRACT_ADDRESS, KYCRegistryArtifact.abi);
    const provider = getProvider();

    // Pagination to avoid RPC limits
    const currentBlock = await provider.getBlockNumber();
    const BLOCK_CHUNK = 200;
    const MAX_BLOCKS = 50000; // Look back approx 1 week
    const fromBlockLimit = Math.max(0, currentBlock - MAX_BLOCKS);

    const filter = contract.filters.KYCSubmitted();
    const uniqueAddresses = new Set<string>();

    // Fetch in chunks
    for (let to = currentBlock; to > fromBlockLimit; to -= BLOCK_CHUNK) {
      const from = Math.max(fromBlockLimit, to - BLOCK_CHUNK);
      try {
        const events = await contract.queryFilter(filter, from, to);
        events.forEach((event: any) => {
          if (event.args && event.args[0]) {
            uniqueAddresses.add(event.args[0]);
          }
        });
      } catch (e) {
        console.warn(`Error fetching events for range ${from}-${to}:`, e);
        // Continue to next chunk even if one fails
      }
    }

    const profiles: UserProfile[] = [];

    for (const address of uniqueAddresses) {
      const profile = await getUserProfile(address);
      if (profile) {
        profiles.push(profile);
      }
    }

    return profiles;
  } catch (error) {
    console.error("Error fetching all users:", error);
    return [];
  }
};