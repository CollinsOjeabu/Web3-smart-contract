export enum UserRole {
  GUEST = 'GUEST',
  USER = 'USER', // Can be Sender/Receiver
  COURIER = 'COURIER',
  ADMIN = 'ADMIN'
}

export enum KYCStatus {
  NOT_STARTED = 'NOT_STARTED',
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED'
}

export enum ShipmentStatus {
  PENDING = 'PENDING',
  IN_TRANSIT = 'IN_TRANSIT',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED'
}

export interface UserProfile {
  walletAddress: string;
  name: string;
  email: string;
  role: UserRole;
  kycStatus: KYCStatus;
  kycDocuments?: {
    idDoc: string;
    addressProof: string;
  };
}

export interface Shipment {
  id: string; // Unique ID
  sender: string; // Wallet Address
  receiver: string; // Wallet Address
  courier: string; // Wallet Address
  title: string;
  description: string;
  category: string;
  weight: number;
  price: number;
  pickupDate: string;
  deliveryDate: string;
  status: ShipmentStatus;
  createdAt: number;
  history: ShipmentHistory[];
}

export interface ShipmentHistory {
  status: ShipmentStatus;
  timestamp: number;
  message: string;
  location: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
}

export interface DashboardStats {
  totalShipments: number;
  activeShipments: number;
  pendingKYC: number;
  completedShipments: number;
}