export const CONFIG = {
  SEPOLIA_CHAIN_ID: 11155111,
  SEPOLIA_RPC_URL: import.meta.env.VITE_SEPOLIA_RPC_URL || "https://eth-sepolia.g.alchemy.com/v2/WNQpKzCHHvep6e4gjg17m",
  
  // Contract Addresses from .env
  KYC_CONTRACT_ADDRESS: import.meta.env.VITE_KYC_CONTRACT_ADDRESS || "",
  MARKETPLACE_CONTRACT_ADDRESS: import.meta.env.VITE_MARKETPLACE_CONTRACT_ADDRESS || "",
  ESCROW_CONTRACT_ADDRESS: import.meta.env.VITE_ESCROW_CONTRACT_ADDRESS || "",
};
