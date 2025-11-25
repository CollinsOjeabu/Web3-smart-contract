import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useWeb3 } from '../context/Web3Context';
import { Shipment, ShipmentStatus, PaymentStatus } from '../types';
import * as BlockchainService from '../services/blockchain';
import { MapPin, Package, Clock, CheckCircle, Search, Navigation, Lock, Unlock, DollarSign, Wallet, RotateCcw } from 'lucide-react';

export const TrackingPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { account, refreshData } = useWeb3();
  const [searchId, setSearchId] = useState(searchParams.get('id') || '');
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [loading, setLoading] = useState(false);

  const [updateStatus, setUpdateStatus] = useState<ShipmentStatus>(ShipmentStatus.IN_TRANSIT);
  const [updateLoc, setUpdateLoc] = useState('');
  const [updateMsg, setUpdateMsg] = useState('');

  const fetchShipment = async (id: string) => {
    setLoading(true);
    const all = await BlockchainService.getAllShipments();
    const found = all.find(s => s.id === id);
    setShipment(found || null);
    setLoading(false);
  };

  useEffect(() => {
    const id = searchParams.get('id');
    if (id) {
        setSearchId(id);
        fetchShipment(id);
    }
  }, [searchParams]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams({ id: searchId });
    fetchShipment(searchId);
  };

  const handleUpdate = async () => {
    if (!shipment) return;
    await BlockchainService.updateShipmentStatus(shipment.id, updateStatus, updateLoc, updateMsg);
    await fetchShipment(shipment.id);
    await refreshData(); // Refresh wallet balance if funds moved
    setUpdateLoc('');
    setUpdateMsg('');
  };

  const isCourier = account && shipment && shipment.courier === account;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Search Bar */}
      <div className="bg-[#151A23] p-10 rounded-2xl shadow-xl border border-white/5 text-center relative overflow-hidden">
        {/* Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-indigo-500/5 blur-3xl pointer-events-none"></div>

        <h1 className="text-3xl font-bold text-white mb-2 relative">Track Shipment</h1>
        <p className="text-slate-400 mb-6 relative">Enter your unique shipment ID to see real-time updates.</p>
        
        <form onSubmit={handleSearch} className="max-w-lg mx-auto flex gap-2 relative">
            <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20}/>
                <input 
                    value={searchId}
                    onChange={e => setSearchId(e.target.value)}
                    placeholder="SHP-XXXXXXXXX"
                    className="w-full bg-[#0B0E14] border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all placeholder-slate-600"
                />
            </div>
            <button type="submit" className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-600/20">Track</button>
        </form>
      </div>

      {loading && <div className="text-center py-12 text-slate-500 animate-pulse">Fetching blockchain data...</div>}

      {shipment && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
            {/* Left: Details */}
            <div className="lg:col-span-2 space-y-6">
                
                {/* Status & Basic Info */}
                <div className="bg-[#151A23] p-8 rounded-2xl shadow-lg border border-white/5">
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Shipment ID</span>
                            <h2 className="text-3xl font-mono font-bold text-white tracking-tight mt-1">#{shipment.id}</h2>
                        </div>
                        <div className={`px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wide border ${
                            shipment.status === 'DELIVERED' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
                            shipment.status === 'CANCELLED' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                            'bg-blue-500/10 text-blue-500 border-blue-500/20'
                        }`}>
                            {shipment.status.replace(/_/g, ' ')}
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm mb-8">
                        <div className="p-4 bg-[#0B0E14] rounded-xl border border-white/5">
                            <span className="block text-xs font-bold text-slate-500 uppercase mb-2">From</span>
                            <span className="font-mono text-slate-300 break-all">{shipment.sender}</span>
                        </div>
                         <div className="p-4 bg-[#0B0E14] rounded-xl border border-white/5">
                            <span className="block text-xs font-bold text-slate-500 uppercase mb-2">To</span>
                            <span className="font-mono text-slate-300 break-all">{shipment.receiver}</span>
                        </div>
                    </div>

                    <div className="border-t border-white/5 pt-8">
                         <h3 className="font-bold text-white mb-6 flex items-center"><Navigation className="mr-2 text-cyan-400" size={20}/> Shipment Progress</h3>
                         <div className="space-y-8 relative pl-6 border-l-2 border-slate-800 ml-3">
                            {shipment.history.slice().reverse().map((h, i) => (
                                <div key={i} className="relative group">
                                    <div className={`absolute -left-[31px] top-1 h-5 w-5 rounded-full border-4 border-[#151A23] ${i===0 ? 'bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]' : 'bg-slate-700'}`}></div>
                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start p-4 rounded-xl hover:bg-white/5 transition-colors -mt-3">
                                        <div>
                                            <p className={`font-bold ${i===0 ? 'text-white' : 'text-slate-400'}`}>{h.status.replace(/_/g, ' ')}</p>
                                            <p className="text-slate-500 text-sm mt-1">{h.message}</p>
                                            {h.location && <p className="text-cyan-400 text-xs mt-2 flex items-center font-medium"><MapPin size={12} className="mr-1"/> {h.location}</p>}
                                        </div>
                                        <span className="text-xs text-slate-600 font-mono mt-2 sm:mt-0 bg-[#0B0E14] px-2 py-1 rounded border border-white/5">{new Date(h.timestamp).toLocaleString()}</span>
                                    </div>
                                </div>
                            ))}
                         </div>
                    </div>
                </div>

                {/* Courier Actions */}
                {isCourier && shipment.status !== ShipmentStatus.DELIVERED && shipment.status !== ShipmentStatus.CANCELLED && (
                    <div className="bg-[#151A23] p-6 rounded-2xl shadow-lg border border-indigo-500/30 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
                        <h3 className="font-bold text-white mb-4 flex items-center"><Package className="mr-2 text-indigo-400"/> Update Status (Courier)</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <select 
                                className="w-full bg-[#0B0E14] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500" 
                                value={updateStatus} 
                                onChange={(e) => setUpdateStatus(e.target.value as ShipmentStatus)}
                            >
                                <option value={ShipmentStatus.IN_TRANSIT}>In Transit</option>
                                <option value={ShipmentStatus.OUT_FOR_DELIVERY}>Out For Delivery</option>
                                <option value={ShipmentStatus.DELIVERED}>Delivered & Release Funds</option>
                                <option value={ShipmentStatus.CANCELLED}>Cancel & Refund</option>
                            </select>
                            <input 
                                className="w-full bg-[#0B0E14] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500" 
                                placeholder="Current Location" 
                                value={updateLoc}
                                onChange={e=>setUpdateLoc(e.target.value)}
                            />
                        </div>
                        <textarea 
                            className="w-full bg-[#0B0E14] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 mb-4" 
                            placeholder="Status Message / Notes"
                            value={updateMsg}
                            onChange={e=>setUpdateMsg(e.target.value)}
                        />
                        <button onClick={handleUpdate} className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl w-full font-bold shadow-lg shadow-indigo-500/20 hover:opacity-90">
                            Update Shipment Status
                        </button>
                    </div>
                )}
            </div>

            {/* Right: Info */}
            <div className="space-y-6">
                
                {/* Smart Contract / Escrow Panel */}
                <div className="bg-[#151A23] p-6 rounded-2xl shadow-lg border border-white/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                    
                    <h3 className="font-bold text-white mb-6 text-sm uppercase tracking-wider flex items-center">
                        <DollarSign size={16} className="text-emerald-400 mr-2"/> 
                        Smart Contract Escrow
                    </h3>
                    
                    <div className="text-center py-4">
                        <span className="text-3xl font-bold text-white">{shipment.price} ETH</span>
                        <p className="text-xs text-slate-400 mt-1">Contract Value</p>
                    </div>

                    <div className="mt-4 bg-[#0B0E14] rounded-xl p-4 border border-white/5">
                        <div className="flex items-center justify-between mb-2">
                             <span className="text-xs font-bold text-slate-500 uppercase">Payment Status</span>
                             {shipment.paymentStatus === PaymentStatus.RELEASED && (
                                 <span className="text-xs font-bold text-emerald-400 flex items-center"><CheckCircle size={12} className="mr-1"/> RELEASED</span>
                             )}
                             {shipment.paymentStatus === PaymentStatus.REFUNDED && (
                                 <span className="text-xs font-bold text-red-400 flex items-center"><RotateCcw size={12} className="mr-1"/> REFUNDED</span>
                             )}
                             {shipment.paymentStatus === PaymentStatus.LOCKED && (
                                 <span className="text-xs font-bold text-orange-400 flex items-center"><Lock size={12} className="mr-1"/> LOCKED</span>
                             )}
                        </div>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-3">
                            <div className={`h-full transition-all duration-1000 ${
                                shipment.paymentStatus === PaymentStatus.RELEASED ? 'bg-emerald-500 w-full' : 
                                shipment.paymentStatus === PaymentStatus.REFUNDED ? 'bg-red-500 w-full' :
                                'bg-orange-500 w-1/2'
                            }`}></div>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-3 text-center">
                            {shipment.paymentStatus === PaymentStatus.RELEASED 
                                ? "Funds have been automatically released to the Courier wallet." 
                                : shipment.paymentStatus === PaymentStatus.REFUNDED
                                ? "Funds have been refunded to the payer's wallet."
                                : "Funds are currently held in the smart contract until delivery is confirmed."}
                        </p>
                    </div>
                </div>

                <div className="bg-[#151A23] p-6 rounded-2xl shadow-lg border border-white/5">
                    <h3 className="font-bold text-white mb-6 text-sm uppercase tracking-wider">Package Details</h3>
                    <div className="space-y-4 text-sm">
                        <DetailRow label="Weight" value={`${shipment.weight} kg`} />
                        <DetailRow label="Category" value={shipment.category} />
                        <DetailRow label="Title" value={shipment.title} />
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

const DetailRow = ({label, value}: any) => (
    <div className="flex justify-between items-center">
        <span className="text-slate-500">{label}</span>
        <span className="font-medium text-slate-300">{value}</span>
    </div>
)