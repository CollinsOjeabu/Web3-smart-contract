import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

export const Web3Provider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [account, setAccount] = useState<string | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refreshData = useCallback(async () => {
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
          name: '',
          email: '',
          role: UserRole.BUYER, // Default to Buyer view until registered
          kycStatus: KYCStatus.NOT_STARTED
        };
      }

      setUserProfile(profile);
      setNotifications(BlockchainService.getNotifications(account));
    } catch (e) {
      console.error("Error refreshing data:", e);
    } finally {
      setIsLoading(false);
    }
  }, [account]);

  const connect = async () => {
    setIsLoading(true);
    try {
      const wallet = await BlockchainService.connectWallet();
      setAccount(wallet);
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
  };

  // Listen for account changes
  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
        } else {
          disconnect();
        }
      };

      const handleChainChanged = () => {
        window.location.reload();
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      // Check if already connected
      window.ethereum.request({ method: 'eth_accounts' }).then((accounts: string[]) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
        }
      });

      return () => {
        if (window.ethereum.removeListener) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
          window.ethereum.removeListener('chainChanged', handleChainChanged);
        }
      };
    }
  }, []);

  useEffect(() => {
    if (account) {
      refreshData();
    }
  }, [account, refreshData]);

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
