
export enum UserRole {
  GUEST = 'GUEST',
  BUYER = 'BUYER', // Standard customer
  SELLER = 'SELLER', // Merchant
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

export enum PaymentStatus {
  PENDING = 'PENDING', // Before creation
  LOCKED = 'LOCKED', // Funds held in smart contract
  RELEASED = 'RELEASED', // Funds transferred to courier/seller
  REFUNDED = 'REFUNDED' // Funds returned to buyer
}

export interface UserProfile {
  walletAddress: string;
  name: string;
  email: string;
  role: UserRole;
  kycStatus?: KYCStatus;
  kycDocuments?: {
    idDoc: string;
    addressProof: string;
  };
}

export interface MarketplaceItem {
  id: string;
  title: string;
  description: string;
  price: number;
  image: string;
  seller: string; // Wallet Address
  category: string;
}

export interface Shipment {
  id: string; // Unique ID
  sender: string; // Wallet Address (Seller)
  receiver: string; // Wallet Address (Buyer)
  courier: string; // Wallet Address
  title: string;
  description: string;
  category: string;
  weight: number;
  price: number;
  paymentStatus: PaymentStatus;
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
  completedShipments: number;
  // Role specific
  revenue?: number;
  spent?: number;
  inventoryCount?: number;
}