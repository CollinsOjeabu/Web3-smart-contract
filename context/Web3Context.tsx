import React, { createContext, useContext, useState, useEffect } from 'react';
import * as BlockchainService from '../services/blockchain';
import { UserProfile, UserRole, KYCStatus, Notification } from '../types';

interface Web3ContextType {
  account: string | null;
  balance: number;
  isConnected: boolean;
  userProfile: UserProfile | null;
  notifications: Notification[];
  isLoading: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  refreshData: () => Promise<void>;
  // Dev only
  setDevRole: (role: UserRole) => void; 
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

export const Web3Provider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [account, setAccount] = useState<string | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Dev state to force a role without real auth
  const [devRoleOverride, setDevRoleOverride] = useState<UserRole | null>(null);

  const refreshData = async () => {
    if (!account) return;
    setIsLoading(true);
    try {
      let profile = await BlockchainService.getUserProfile(account);
      const bal = await BlockchainService.getBalance(account);
      setBalance(bal);
      
      // If user doesn't exist yet, create a partial one for UI state
      if (!profile) {
        profile = {
            walletAddress: account,
            name: 'New User',
            email: '',
            role: UserRole.BUYER, // Default to Buyer
            kycStatus: KYCStatus.NOT_STARTED
        };
      }

      if (devRoleOverride) {
        profile.role = devRoleOverride;
      }

      setUserProfile(profile);
      setNotifications(BlockchainService.getNotifications(account));
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const connect = async () => {
    setIsLoading(true);
    try {
      const wallet = await BlockchainService.connectWallet();
      setAccount(wallet);
      if (wallet.includes('ADMIN')) { 
        setDevRoleOverride(UserRole.ADMIN);
      }
    } catch (error) {
      console.error("Connection failed", error);
    } finally {
      setIsLoading(false);
    }
  };

  const disconnect = () => {
    setAccount(null);
    setUserProfile(null);
    setNotifications([]);
    setBalance(0);
    setDevRoleOverride(null);
  };

  useEffect(() => {
    if (account) {
      refreshData();
    }
  }, [account, devRoleOverride]);

  return (
    <Web3Context.Provider value={{
      account,
      balance,
      isConnected: !!account,
      userProfile,
      notifications,
      isLoading,
      connect,
      disconnect,
      refreshData,
      setDevRole: setDevRoleOverride
    }}>
      {children}
    </Web3Context.Provider>
  );
};

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) throw new Error("useWeb3 must be used within a Web3Provider");
  return context;
};