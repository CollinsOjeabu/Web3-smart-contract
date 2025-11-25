import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Context';
import * as BlockchainService from '../services/blockchain';
import { MarketplaceItem, UserRole } from '../types';
import { Plus, Trash2, Package, Tag, DollarSign, Image as ImageIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const SellerStudio: React.FC = () => {
    const { account, userProfile } = useWeb3();
    const navigate = useNavigate();
    const [items, setItems] = useState<MarketplaceItem[]>([]);
    const [isAdding, setIsAdding] = useState(false);
    const [newItem, setNewItem] = useState({
        title: '',
        description: '',
        price: '',
        category: 'General',
        image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80'
    });

    useEffect(() => {
        if (userProfile && userProfile.role !== UserRole.SELLER) {
            navigate('/');
            return;
        }
        loadInventory();
    }, [userProfile]);

    const loadInventory = async () => {
        const catalog = await BlockchainService.getMarketplaceItems();
        // Filter items belonging to this seller (mocked logic or actual check)
        // Since getMarketplaceItems returns everything, we filter by seller address if we want strict viewing,
        // but for now, let's assume we want to see everything to edit them in this demo environment.
        // In prod: catalog.filter(i => i.seller === account)
        if(account) {
            const myItems = catalog.filter(i => i.seller === account);
            setItems(myItems);
        }
    };

    const handleAddItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!account) return;
        
        await BlockchainService.addMarketplaceItem({
            title: newItem.title,
            description: newItem.description,
            price: parseFloat(newItem.price),
            category: newItem.category,
            image: newItem.image,
            seller: account
        });
        
        setIsAdding(false);
        setNewItem({ title: '', description: '', price: '', category: 'General', image: newItem.image });
        loadInventory();
    };

    const handleDelete = async (id: string) => {
        if(!account) return;
        await BlockchainService.deleteMarketplaceItem(id, account);
        loadInventory();
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-white">Seller Studio</h1>
                    <p className="text-slate-400 mt-2">Manage your inventory and product listings.</p>
                </div>
                <button 
                    onClick={() => setIsAdding(!isAdding)} 
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/20 text-sm flex items-center"
                >
                    <Plus size={16} className="mr-2"/> {isAdding ? 'Cancel' : 'Add New Item'}
                </button>
            </div>

            {isAdding && (
                <div className="bg-[#151A23] p-8 rounded-2xl border border-white/5 shadow-xl animate-in fade-in slide-in-from-top-4">
                    <h2 className="text-xl font-bold text-white mb-6">List New Product</h2>
                    <form onSubmit={handleAddItem} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Title</label>
                            <input required className="w-full bg-[#0B0E14] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500" value={newItem.title} onChange={e => setNewItem({...newItem, title: e.target.value})} placeholder="Product Name"/>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Category</label>
                            <select className="w-full bg-[#0B0E14] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500" value={newItem.category} onChange={e => setNewItem({...newItem, category: e.target.value})}>
                                <option>General</option>
                                <option>Electronics</option>
                                <option>Fashion</option>
                                <option>Home</option>
                            </select>
                        </div>
                        <div className="md:col-span-2">
                             <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Description</label>
                             <textarea required className="w-full bg-[#0B0E14] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500" rows={3} value={newItem.description} onChange={e => setNewItem({...newItem, description: e.target.value})} placeholder="Describe your item..."/>
                        </div>
                        <div>
                             <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Price (ETH)</label>
                             <input required type="number" step="0.001" className="w-full bg-[#0B0E14] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500" value={newItem.price} onChange={e => setNewItem({...newItem, price: e.target.value})} placeholder="0.00"/>
                        </div>
                        <div>
                             <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Image URL</label>
                             <input className="w-full bg-[#0B0E14] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500" value={newItem.image} onChange={e => setNewItem({...newItem, image: e.target.value})} placeholder="https://..."/>
                        </div>
                        <div className="md:col-span-2 flex justify-end mt-2">
                            <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-emerald-600/20">
                                Publish Listing
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {items.length === 0 ? (
                    <div className="col-span-full py-16 text-center text-slate-500 bg-[#151A23] rounded-2xl border border-white/5">
                        <Package size={48} className="mx-auto mb-4 opacity-20" />
                        <p>No items in your inventory. Add your first product!</p>
                    </div>
                ) : items.map(item => (
                    <div key={item.id} className="bg-[#151A23] rounded-2xl border border-white/5 overflow-hidden group">
                        <div className="h-40 overflow-hidden relative">
                             <img src={item.image} alt={item.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                             <div className="absolute top-2 left-2 bg-black/60 px-2 py-1 rounded text-[10px] text-white font-bold">{item.category}</div>
                        </div>
                        <div className="p-5">
                            <h3 className="font-bold text-white mb-1">{item.title}</h3>
                            <p className="text-xs text-slate-500 mb-4 line-clamp-2">{item.description}</p>
                            <div className="flex justify-between items-center">
                                <span className="font-mono text-emerald-400 font-bold">{item.price} ETH</span>
                                <button onClick={() => handleDelete(item.id)} className="text-red-400 hover:text-red-300 p-2 hover:bg-red-400/10 rounded-lg transition-colors">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}