import React, { useEffect, useState } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { Shipment, ShipmentStatus, UserRole } from '../types';
import * as BlockchainService from '../services/blockchain';
import { Link } from 'react-router-dom';
import { Package, Truck, ArrowRight, ArrowLeft, Filter, Search } from 'lucide-react';

export const ShipmentsPage: React.FC = () => {
  const { account, userProfile } = useWeb3();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'SENT' | 'RECEIVED' | 'COURIER'>('ALL');

  useEffect(() => {
     if(userProfile?.role === UserRole.SELLER) setFilter('SENT');
     else if(userProfile?.role === UserRole.BUYER) setFilter('RECEIVED');
     else if(userProfile?.role === UserRole.COURIER) setFilter('COURIER');
     else setFilter('ALL');
  }, [userProfile]);

  useEffect(() => {
    const fetch = async () => {
        const all = await BlockchainService.getAllShipments();
        let filtered = all;
        if (!account) return;

        if (filter === 'SENT') filtered = all.filter(s => s.sender === account);
        else if (filter === 'RECEIVED') filtered = all.filter(s => s.receiver === account);
        else if (filter === 'COURIER') filtered = all.filter(s => s.courier === account);
        else filtered = all.filter(s => s.sender === account || s.receiver === account || s.courier === account);

        setShipments(filtered);
    };
    fetch();
  }, [account, filter]);

  const StatusBadge = ({ status }: { status: ShipmentStatus }) => {
    const colors = {
        [ShipmentStatus.PENDING]: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
        [ShipmentStatus.IN_TRANSIT]: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
        [ShipmentStatus.OUT_FOR_DELIVERY]: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
        [ShipmentStatus.DELIVERED]: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
        [ShipmentStatus.CANCELLED]: 'bg-red-500/10 text-red-500 border-red-500/20',
    };
    return (
        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${colors[status]}`}>
            {status.replace(/_/g, ' ')}
        </span>
    );
  };

  return (
    <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <h1 className="text-2xl font-bold text-white">
                    {userProfile?.role === UserRole.SELLER ? 'Sales Orders' : userProfile?.role === UserRole.BUYER ? 'My Purchases' : 'Shipments'}
                </h1>
                <p className="text-slate-400 text-sm mt-1">Manage and track your logistics.</p>
            </div>
            
            <div className="flex bg-[#151A23] rounded-xl p-1 shadow-sm border border-white/5">
                {['ALL', 'SENT', 'RECEIVED', 'COURIER'].map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f as any)}
                        className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${filter === f ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
                    >
                        {f}
                    </button>
                ))}
            </div>
        </div>

        <div className="bg-[#151A23] rounded-2xl shadow-sm border border-white/5 overflow-hidden">
            {/* Table Header/Toolbar */}
            <div className="p-4 border-b border-white/5 flex justify-between items-center">
                <div className="flex items-center text-slate-400 text-sm">
                    <Filter size={16} className="mr-2" />
                    <span>Filtering by: <span className="text-white font-medium">{filter}</span></span>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-[#0F1219] border-b border-white/5">
                        <tr>
                            <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">ID</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Item Details</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Value</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Participant</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {shipments.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-16 text-center">
                                    <div className="flex flex-col items-center justify-center text-slate-500">
                                        <Package size={48} className="mb-4 opacity-20" />
                                        <p>No shipments found in this category.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : shipments.map((s) => (
                            <tr key={s.id} className="hover:bg-white/5 transition-colors group">
                                <td className="px-6 py-4 font-mono text-xs text-slate-400 group-hover:text-indigo-400">#{s.id}</td>
                                <td className="px-6 py-4">
                                    <p className="font-semibold text-white text-sm">{s.title}</p>
                                    <p className="text-xs text-slate-500">{s.category}</p>
                                </td>
                                <td className="px-6 py-4 text-sm font-medium text-slate-300">{s.price} ETH</td>
                                <td className="px-6 py-4">
                                    {/* Logic to show the OTHER party */}
                                    {s.sender === account ? (
                                        <div>
                                            <p className="text-[10px] text-slate-500 uppercase">Buyer</p>
                                            <p className="font-mono text-xs text-white">{s.receiver.substring(0,8)}...</p>
                                        </div>
                                    ) : (
                                        <div>
                                            <p className="text-[10px] text-slate-500 uppercase">Seller</p>
                                            <p className="font-mono text-xs text-white">{s.sender.substring(0,8)}...</p>
                                        </div>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    <StatusBadge status={s.status} />
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <Link to={`/tracking?id=${s.id}`} className="text-indigo-400 hover:text-indigo-300 text-xs font-bold border border-indigo-500/30 px-3 py-1.5 rounded hover:bg-indigo-500/20 transition-all">
                                        Track
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
  );
};