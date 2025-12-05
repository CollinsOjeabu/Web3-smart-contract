
import { UserProfile, Shipment, UserRole, ShipmentStatus, Notification, PaymentStatus, MarketplaceItem, KYCStatus } from '../types';

// Constants
const STORAGE_KEY_USERS = 'chainflow_users';
const STORAGE_KEY_SHIPMENTS = 'chainflow_shipments';
const STORAGE_KEY_NOTIFICATIONS = 'chainflow_notifications';
const STORAGE_KEY_BALANCES = 'chainflow_balances';
const STORAGE_KEY_CATALOG = 'chainflow_catalog';
const MOCK_DELAY = 600; // Simulate network latency

// Helper to generate IDs
const generateId = () => Math.random().toString(36).substr(2, 9).toUpperCase();

// --- Local Storage Helpers ---
const getStoredUsers = (): UserProfile[] => {
  const data = localStorage.getItem(STORAGE_KEY_USERS);
  return data ? JSON.parse(data) : [];
};

const saveUsers = (users: UserProfile[]) => {
  localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
};

const getStoredShipments = (): Shipment[] => {
  const data = localStorage.getItem(STORAGE_KEY_SHIPMENTS);
  return data ? JSON.parse(data) : [];
};

const saveShipments = (shipments: Shipment[]) => {
  localStorage.setItem(STORAGE_KEY_SHIPMENTS, JSON.stringify(shipments));
};

const getStoredNotifications = (): Notification[] => {
  const data = localStorage.getItem(STORAGE_KEY_NOTIFICATIONS);
  return data ? JSON.parse(data) : [];
};

const saveNotifications = (notes: Notification[]) => {
  localStorage.setItem(STORAGE_KEY_NOTIFICATIONS, JSON.stringify(notes));
};

const getStoredBalances = (): Record<string, number> => {
    const data = localStorage.getItem(STORAGE_KEY_BALANCES);
    return data ? JSON.parse(data) : {};
};

const saveBalances = (balances: Record<string, number>) => {
    localStorage.setItem(STORAGE_KEY_BALANCES, JSON.stringify(balances));
};

const getStoredCatalog = (): MarketplaceItem[] => {
    const data = localStorage.getItem(STORAGE_KEY_CATALOG);
    // Return mock data if empty
    if (!data) return MOCK_CATALOG;
    return JSON.parse(data);
};

const saveCatalog = (items: MarketplaceItem[]) => {
    localStorage.setItem(STORAGE_KEY_CATALOG, JSON.stringify(items));
};

// --- Mock Service Methods ---

export const connectWallet = async (): Promise<string> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Simulate connecting a random wallet if not exists, or returning existing
      const stored = localStorage.getItem('chainflow_active_wallet');
      let wallet = stored;
      
      if (!wallet) {
        wallet = `0x${generateId()}${generateId()}...`;
        localStorage.setItem('chainflow_active_wallet', wallet);
      }

      // Initialize balance if new
      const balances = getStoredBalances();
      if (!balances[wallet]) {
          balances[wallet] = 100.000; // Give new users 100 ETH testnet funds
          saveBalances(balances);
      }

      resolve(wallet);
    }, MOCK_DELAY);
  });
};

export const getBalance = async (walletAddress: string): Promise<number> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            const balances = getStoredBalances();
            resolve(balances[walletAddress] || 0);
        }, MOCK_DELAY / 2);
    });
};

export const getUserProfile = async (walletAddress: string): Promise<UserProfile | null> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const users = getStoredUsers();
      const user = users.find(u => u.walletAddress === walletAddress);
      resolve(user || null);
    }, MOCK_DELAY / 2);
  });
};

export const registerUser = async (profile: UserProfile): Promise<UserProfile> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const users = getStoredUsers();
      const existingIndex = users.findIndex(u => u.walletAddress === profile.walletAddress);
      
      if (existingIndex >= 0) {
        users[existingIndex] = profile;
      } else {
        users.push(profile);
      }
      saveUsers(users);
      resolve(profile);
    }, MOCK_DELAY);
  });
};

// Used for P2P shipment creation (Manual)
export const createShipment = async (shipmentData: Omit<Shipment, 'id' | 'status' | 'createdAt' | 'history' | 'paymentStatus'>): Promise<Shipment> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // 1. Check Balance
      const balances = getStoredBalances();
      const senderBalance = balances[shipmentData.sender] || 0;
      
      if (senderBalance < shipmentData.price) {
          reject("Insufficient ETH balance to fund smart contract.");
          return;
      }

      // 2. Deduct Funds (Lock in Contract)
      balances[shipmentData.sender] = senderBalance - shipmentData.price;
      saveBalances(balances);

      const shipments = getStoredShipments();
      const newShipment: Shipment = {
        ...shipmentData,
        id: `SHP-${generateId()}`,
        status: ShipmentStatus.PENDING,
        paymentStatus: PaymentStatus.LOCKED,
        createdAt: Date.now(),
        history: [{
          status: ShipmentStatus.PENDING,
          timestamp: Date.now(),
          message: 'Smart Contract Initialized & Funds Locked',
          location: 'Origin'
        }]
      };
      shipments.push(newShipment);
      saveShipments(shipments);
      
      // Notify participants
      createNotification(shipmentData.sender, "Contract Created", `Shipment ${newShipment.id} created. ${shipmentData.price} ETH locked in escrow.`, "SUCCESS");
      createNotification(shipmentData.receiver, "Incoming Shipment", `You have a new incoming shipment ${newShipment.id}.`, "INFO");
      createNotification(shipmentData.courier, "New Assignment", `Shipment ${newShipment.id} assigned. Reward: ${shipmentData.price} ETH upon delivery.`, "WARNING");
      
      resolve(newShipment);
    }, MOCK_DELAY);
  });
};

// Seller dispatching the item
export const dispatchShipment = async (id: string): Promise<Shipment> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const shipments = getStoredShipments();
            const idx = shipments.findIndex(s => s.id === id);
            
            if (idx === -1) {
                reject("Shipment not found");
                return;
            }

            const shipment = shipments[idx];
            
            // Validate Logic
            if (shipment.status !== ShipmentStatus.PENDING) {
                reject("Shipment is not in pending state");
                return;
            }

            shipment.status = ShipmentStatus.IN_TRANSIT;
            shipment.history.push({
                status: ShipmentStatus.IN_TRANSIT,
                location: 'Seller Warehouse',
                message: 'Seller approved and dispatched package to Courier',
                timestamp: Date.now()
            });

            saveShipments(shipments);

            createNotification(shipment.receiver, "Order Shipped", `Your order ${shipment.title} has been shipped by the seller!`, "SUCCESS");
            createNotification(shipment.courier, "Package Ready", `Package ${shipment.id} is ready for pickup at Seller location.`, "WARNING");
            createNotification(shipment.sender, "Dispatch Confirmed", `You have approved order ${shipment.id}.`, "INFO");

            resolve(shipment);
        }, MOCK_DELAY);
    });
}

export const updateShipmentStatus = async (id: string, status: ShipmentStatus, location: string, message: string): Promise<Shipment> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const shipments = getStoredShipments();
      const idx = shipments.findIndex(s => s.id === id);
      if (idx === -1) {
        reject("Shipment not found");
        return;
      }
      
      const shipment = shipments[idx];
      let paymentMessage = "";

      // Smart Contract Logic: Release Funds on Delivery
      if (status === ShipmentStatus.DELIVERED && shipment.paymentStatus === PaymentStatus.LOCKED) {
          const balances = getStoredBalances();
          // In the marketplace model, the 'price' goes to the Seller (who is the 'Sender' in the shipment struct).
          
          const recipientAddress = shipment.sender; // Seller receives funds
          const currentBal = balances[recipientAddress] || 0;
          balances[recipientAddress] = currentBal + shipment.price;
          saveBalances(balances);

          shipment.paymentStatus = PaymentStatus.RELEASED;
          paymentMessage = ` | Smart Contract: ${shipment.price} ETH released to Seller.`;
          createNotification(shipment.sender, "Funds Released", `Shipment delivered! ${shipment.price} ETH released to your wallet.`, "SUCCESS");
          createNotification(shipment.courier, "Delivery Confirmed", `Delivery recorded successfully.`, "SUCCESS");
      }

      // Smart Contract Logic: Refund Funds on Cancellation
      if (status === ShipmentStatus.CANCELLED && shipment.paymentStatus === PaymentStatus.LOCKED) {
        const balances = getStoredBalances();
        // Refund the Buyer (Receiver)
        const recipientAddress = shipment.receiver;
        const currentBal = balances[recipientAddress] || 0;
        
        balances[recipientAddress] = currentBal + shipment.price;
        saveBalances(balances);

        shipment.paymentStatus = PaymentStatus.REFUNDED;
        paymentMessage = ` | Smart Contract: ${shipment.price} ETH refunded to Buyer.`;
        createNotification(shipment.receiver, "Funds Refunded", `Order cancelled. ${shipment.price} ETH refunded to your wallet.`, "WARNING");
      }

      shipment.status = status;
      shipment.history.push({
        status,
        location,
        message: message + paymentMessage,
        timestamp: Date.now()
      });
      
      saveShipments(shipments);
      
      // Notifications
      createNotification(shipment.sender, "Shipment Update", `Shipment ${id} is now ${status}.${paymentMessage}`, "INFO");
      createNotification(shipment.receiver, "Shipment Update", `Shipment ${id} is now ${status}.`, "INFO");
      
      resolve(shipment);
    }, MOCK_DELAY);
  });
};

export const getAllShipments = async (): Promise<Shipment[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(getStoredShipments());
    }, MOCK_DELAY / 2);
  });
};

// --- Marketplace Functions ---

const MOCK_CATALOG: MarketplaceItem[] = [
    {
        id: 'ITM-001',
        title: 'Premium Wireless Headphones',
        description: 'Noise cancelling, 40h battery life, premium sound quality.',
        price: 0.15,
        category: 'Electronics',
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80',
        seller: '0xDEMO...SELLER'
    },
    {
        id: 'ITM-002',
        title: 'Mechanical Keyboard',
        description: 'RGB Backlit, Blue Switches, compact 60% layout.',
        price: 0.08,
        category: 'Electronics',
        image: 'https://images.unsplash.com/photo-1587829741301-dc798b91add1?w=500&q=80',
        seller: '0xDEMO...SELLER'
    },
    {
        id: 'ITM-005',
        title: 'Limited Edition Sneakers',
        description: 'Size 10, never worn, authentic collector item.',
        price: 0.5,
        category: 'Fashion',
        image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=80',
        seller: '0xDEMO...SELLER'
    }
];

export const getMarketplaceItems = async (): Promise<MarketplaceItem[]> => {
    return new Promise(resolve => setTimeout(() => resolve(getStoredCatalog()), MOCK_DELAY/2));
};

export const addMarketplaceItem = async (item: Omit<MarketplaceItem, 'id'>): Promise<MarketplaceItem> => {
    return new Promise(resolve => {
        setTimeout(() => {
            const catalog = getStoredCatalog();
            const newItem = { ...item, id: `ITM-${generateId()}` };
            catalog.push(newItem);
            saveCatalog(catalog);
            createNotification(item.seller, "Item Listed", `${item.title} is now live in the marketplace.`, "SUCCESS");
            resolve(newItem);
        }, MOCK_DELAY);
    });
};

export const deleteMarketplaceItem = async (id: string, sellerAddr: string): Promise<void> => {
    return new Promise(resolve => {
        setTimeout(() => {
            const catalog = getStoredCatalog();
            const filtered = catalog.filter(i => i.id !== id);
            saveCatalog(filtered);
            createNotification(sellerAddr, "Item Removed", `Item removed from marketplace.`, "INFO");
            resolve();
        }, MOCK_DELAY);
    });
};

export const purchaseItem = async (item: MarketplaceItem, buyerAddress: string): Promise<Shipment> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const balances = getStoredBalances();
            const buyerBalance = balances[buyerAddress] || 0;

            if (buyerBalance < item.price) {
                reject("Insufficient funds");
                return;
            }

            // Deduct from Buyer
            balances[buyerAddress] = buyerBalance - item.price;
            saveBalances(balances);

            // Create Shipment automatically
            const shipments = getStoredShipments();
            const newShipment: Shipment = {
                id: `ORD-${generateId()}`,
                title: `Order: ${item.title}`,
                description: item.description,
                category: item.category,
                weight: 1.0, // Default for demo
                price: item.price,
                
                // IMPORTANT: Linking Seller and Buyer
                sender: item.seller, 
                receiver: buyerAddress,
                courier: '0x999...Courier', // Auto-assign for demo or leave empty
                
                status: ShipmentStatus.PENDING,
                paymentStatus: PaymentStatus.LOCKED,
                pickupDate: new Date().toISOString().split('T')[0],
                deliveryDate: new Date(Date.now() + 86400000*3).toISOString().split('T')[0],
                createdAt: Date.now(),
                history: [{
                    status: ShipmentStatus.PENDING,
                    timestamp: Date.now(),
                    message: 'Order Placed. Waiting for Seller Approval.',
                    location: 'Marketplace'
                }]
            };

            shipments.push(newShipment);
            saveShipments(shipments);

            createNotification(buyerAddress, "Order Confirmed", `You purchased ${item.title}. ${item.price} ETH locked in escrow.`, "SUCCESS");
            createNotification(item.seller, "New Sale", `Order received for ${item.title}. Please approve shipment.`, "SUCCESS");
            
            resolve(newShipment);
        }, MOCK_DELAY);
    });
};

// --- Admin/User Management Functions ---

export const getAllUsers = async (): Promise<UserProfile[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(getStoredUsers());
    }, MOCK_DELAY / 2);
  });
};

export const verifyKYC = async (walletAddress: string, status: KYCStatus): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(() => {
        const users = getStoredUsers();
        const idx = users.findIndex(u => u.walletAddress === walletAddress);
        if (idx !== -1) {
            users[idx].kycStatus = status;
            saveUsers(users);
            
            // Send notification
            const msg = status === KYCStatus.VERIFIED 
                ? "Your KYC documents have been verified. You have full access."
                : "Your KYC verification was rejected. Please check your documents.";
            const type = status === KYCStatus.VERIFIED ? "SUCCESS" : "ERROR";
            createNotification(walletAddress, "KYC Status Update", msg, type);
        }
        resolve();
    }, MOCK_DELAY);
  });
};

// --- Notification System ---

export const getNotifications = (walletAddress: string): Notification[] => {
    return getStoredNotifications().filter(n => true).sort((a,b) => b.timestamp - a.timestamp); 
};

const createNotification = (recipient: string, title: string, message: string, type: Notification['type']) => {
    const notes = getStoredNotifications();
    notes.push({
        id: generateId(),
        title,
        message,
        timestamp: Date.now(),
        read: false,
        type
    });
    saveNotifications(notes);
};

// --- Dev Tools ---
export const clearStorage = () => {
    localStorage.clear();
    window.location.reload();
}