import React, { useEffect, useState } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { MarketplaceItem, UserRole } from '../types';
import * as BlockchainService from '../services/blockchain';
import { ShoppingBag, Tag, DollarSign, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Catalog: React.FC = () => {
  const { account, balance, isConnected, connect, refreshData, userProfile } = useWeb3();
  const navigate = useNavigate();
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  useEffect(() => {
    const fetchItems = async () => {
        const data = await BlockchainService.getMarketplaceItems();
        setItems(data);
        setLoading(false);
    };
    fetchItems();
  }, []);

  const handleBuy = async (item: MarketplaceItem) => {
    if (!account) return;
    setPurchasing(item.id);
    try {
        const shipment = await BlockchainService.purchaseItem(item, account);
        await refreshData();
        navigate(`/tracking?id=${shipment.id}`);
    } catch (e) {
        alert("Purchase failed: " + e);
    } finally {
        setPurchasing(null);
    }
  };

  const isBuyer = userProfile?.role === UserRole.BUYER;
  const isSeller = userProfile?.role === UserRole.SELLER;

  return (
    <div className="space-y-8">
        <div className="flex justify-between items-end">
            <div>
                <h1 className="text-3xl font-bold text-white">Marketplace Catalog</h1>
                <p className="text-slate-400 mt-2">
                    {isSeller ? "Browse what's currently available (View Only)." : "Buy items safely with crypto escrow protection."}
                </p>
            </div>
            {!isConnected && (
                <button onClick={connect} className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/20 text-sm flex items-center">
                    <Wallet size={16} className="mr-2"/> Connect to Buy
                </button>
            )}
        </div>

        {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1,2,3].map(i => (
                    <div key={i} className="bg-[#151A23] h-80 rounded-2xl border border-white/5 animate-pulse"></div>
                ))}
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {items.map(item => (
                    <div key={item.id} className="bg-[#151A23] rounded-2xl border border-white/5 overflow-hidden hover:border-white/10 transition-all group shadow-lg">
                        <div className="h-48 overflow-hidden relative">
                            <img src={item.image} alt={item.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                            <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-lg text-[10px] font-bold text-white uppercase tracking-wide flex items-center border border-white/10">
                                <Tag size={10} className="mr-1 text-cyan-400" /> {item.category}
                            </div>
                        </div>
                        <div className="p-6">
                            <h3 className="text-lg font-bold text-white mb-2 line-clamp-1">{item.title}</h3>
                            <p className="text-slate-400 text-sm mb-4 line-clamp-2 h-10">{item.description}</p>
                            
                            <div className="flex items-end justify-between mt-4 pt-4 border-t border-white/5">
                                <div>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase">Price</p>
                                    <div className="text-xl font-bold text-emerald-400 flex items-center">
                                        <DollarSign size={16} strokeWidth={3} className="-ml-1" />
                                        {item.price} ETH
                                    </div>
                                </div>
                                
                                {isConnected && isBuyer ? (
                                    <button 
                                        onClick={() => handleBuy(item)}
                                        disabled={!!purchasing || balance < item.price}
                                        className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg flex items-center ${
                                            balance < item.price 
                                            ? 'bg-slate-700 text-slate-400 cursor-not-allowed' 
                                            : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:shadow-emerald-500/20'
                                        }`}
                                    >
                                        {purchasing === item.id ? 'Processing...' : balance < item.price ? 'Insufficient ETH' : 'Buy Now'}
                                    </button>
                                ) : isConnected && isSeller ? (
                                    <div className="px-4 py-2 bg-white/5 rounded-lg text-xs text-slate-400 font-medium">View Only</div>
                                ) : (
                                    <div className="px-4 py-2 bg-white/5 rounded-lg text-xs text-slate-400 font-medium">Connect Wallet</div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )}
    </div>
  );
};