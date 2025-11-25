import { UserProfile, Shipment, KYCStatus, UserRole, ShipmentStatus, Notification } from '../types';

// Constants
const STORAGE_KEY_USERS = 'chainflow_users';
const STORAGE_KEY_SHIPMENTS = 'chainflow_shipments';
const STORAGE_KEY_NOTIFICATIONS = 'chainflow_notifications';
const MOCK_DELAY = 800; // Simulate network latency

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

// --- Mock Service Methods ---

export const connectWallet = async (): Promise<string> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Simulate connecting a random wallet if not exists, or returning existing
      const stored = localStorage.getItem('chainflow_active_wallet');
      if (stored) {
        resolve(stored);
      } else {
        const newWallet = `0x${generateId()}${generateId()}...`;
        localStorage.setItem('chainflow_active_wallet', newWallet);
        resolve(newWallet);
      }
    }, MOCK_DELAY);
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
      createNotification(profile.walletAddress, "KYC Submitted", "Your KYC documents have been submitted for review.", "INFO");
      resolve(profile);
    }, MOCK_DELAY);
  });
};

export const createShipment = async (shipmentData: Omit<Shipment, 'id' | 'status' | 'createdAt' | 'history'>): Promise<Shipment> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const shipments = getStoredShipments();
      const newShipment: Shipment = {
        ...shipmentData,
        id: `SHP-${generateId()}`,
        status: ShipmentStatus.PENDING,
        createdAt: Date.now(),
        history: [{
          status: ShipmentStatus.PENDING,
          timestamp: Date.now(),
          message: 'Shipment Created',
          location: 'Origin'
        }]
      };
      shipments.push(newShipment);
      saveShipments(shipments);
      
      // Notify participants
      createNotification(shipmentData.sender, "Shipment Created", `Shipment ${newShipment.id} created successfully.`, "SUCCESS");
      createNotification(shipmentData.receiver, "Incoming Shipment", `You have a new incoming shipment ${newShipment.id}.`, "INFO");
      createNotification(shipmentData.courier, "New Assignment", `You have been assigned shipment ${newShipment.id}.`, "WARNING");
      
      resolve(newShipment);
    }, MOCK_DELAY);
  });
};

export const updateShipmentStatus = async (id: string, status: ShipmentStatus, location: string, message: string): Promise<Shipment> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const shipments = getStoredShipments();
      const idx = shipments.findIndex(s => s.id === id);
      if (idx === -1) {
        reject("Shipment not found");
        return;
      }
      
      shipments[idx].status = status;
      shipments[idx].history.push({
        status,
        location,
        message,
        timestamp: Date.now()
      });
      
      saveShipments(shipments);
      createNotification(shipments[idx].sender, "Shipment Update", `Shipment ${id} is now ${status}.`, "INFO");
      createNotification(shipments[idx].receiver, "Shipment Update", `Shipment ${id} is now ${status}.`, "INFO");
      
      resolve(shipments[idx]);
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

// --- Admin Functions ---

export const getAllUsers = async (): Promise<UserProfile[]> => {
    return new Promise((resolve) => {
        setTimeout(() => resolve(getStoredUsers()), MOCK_DELAY / 2);
    });
};

export const verifyKYC = async (walletAddress: string, status: KYCStatus): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const users = getStoredUsers();
      const idx = users.findIndex(u => u.walletAddress === walletAddress);
      if (idx >= 0) {
        users[idx].kycStatus = status;
        saveUsers(users);
        createNotification(walletAddress, "KYC Update", `Your KYC status has been updated to ${status}.`, status === KYCStatus.VERIFIED ? "SUCCESS" : "ERROR");
      }
      resolve();
    }, MOCK_DELAY);
  });
};

// --- Notification System ---

export const getNotifications = (walletAddress: string): Notification[] => {
    // In a real app, we filter by address. Here we just return all for demo simplicity or filter if needed.
    // For this mock, we'll return all global + specific.
    return getStoredNotifications().sort((a,b) => b.timestamp - a.timestamp);
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
    localStorage.removeItem(STORAGE_KEY_USERS);
    localStorage.removeItem(STORAGE_KEY_SHIPMENTS);
    localStorage.removeItem(STORAGE_KEY_NOTIFICATIONS);
    localStorage.removeItem('chainflow_active_wallet');
    window.location.reload();
}