import React, { useState } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { KYCStatus } from '../types';
import * as BlockchainService from '../services/blockchain';
import { useNavigate } from 'react-router-dom';
import { Truck, Package, Calendar, DollarSign, UploadCloud, Check, ChevronRight, Lock } from 'lucide-react';

const Label = ({children}: {children?: React.ReactNode}) => <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-2 ml-1">{children}</label>

const Input = (props: any) => (
    <input className={`w-full bg-[#0B0E14] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all placeholder-slate-600 ${props.className}`} {...props} />
)

const Select = (props: any) => (
    <select className="w-full bg-[#0B0E14] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all appearance-none" {...props} />
)

const ReviewRow = ({ label, value, isMono, isHighlight }: any) => (
    <div className="flex justify-between items-center border-b border-white/5 pb-3 last:border-0 last:pb-0">
        <span className="text-slate-500">{label}</span>
        <span className={`font-medium ${isMono ? 'font-mono text-xs' : ''} ${isHighlight ? 'text-cyan-400 font-bold text-lg' : 'text-slate-200'}`}>{value || '-'}</span>
    </div>
)

export const CreateShipment: React.FC = () => {
  const { userProfile, account, refreshData } = useWeb3();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [step, setStep] = useState(1);
  const [data, setData] = useState({
    title: '',
    category: 'General',
    description: '',
    receiver: '',
    courier: '',
    pickupDate: '',
    deliveryDate: '',
    weight: '',
    price: '',
    dim: '10x10x10',
    type: 'Standard'
  });

  if (userProfile?.kycStatus !== KYCStatus.VERIFIED) {
    return (
        <div className="flex flex-col items-center justify-center h-[50vh] text-center p-8 bg-[#151A23] rounded-2xl border border-white/5 m-4">
             <div className="h-20 w-20 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-6 border border-red-500/20">
                <Check size={40} />
             </div>
             <h2 className="text-3xl font-bold text-white mb-2">KYC Required</h2>
             <p className="text-slate-400 mb-8 max-w-md">You must complete the Know Your Customer (KYC) verification process before you can create shipments on the blockchain.</p>
             <button onClick={() => navigate('/kyc')} className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-red-600/20">Verify Identity Now</button>
        </div>
    );
  }

  const handleNext = () => setStep(step + 1);
  const handleBack = () => setStep(step - 1);

  const handleSubmit = async () => {
    if(!account) return;
    setLoading(true);
    try {
        await BlockchainService.createShipment({
            sender: account,
            receiver: data.receiver, 
            courier: data.courier,
            title: data.title,
            description: data.description,
            category: data.category,
            weight: parseFloat(data.weight),
            price: parseFloat(data.price),
            pickupDate: data.pickupDate,
            deliveryDate: data.deliveryDate
        });
        await refreshData();
        navigate('/shipments');
    } catch (e: any) {
        alert('Transaction Failed: ' + e);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2">New Shipment</h1>
        <p className="text-slate-400 mb-8">Initialize a new smart contract for delivery.</p>

        {/* Stepper */}
        <div className="mb-10">
            <div className="flex items-center justify-between relative z-10">
                {[1, 2, 3, 4].map((s) => (
                    <div key={s} className="flex flex-col items-center group cursor-default">
                        <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold transition-all duration-500 ${step >= s ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(34,211,238,0.5)] scale-110' : 'bg-[#1A1F2E] text-slate-500 border border-white/10'}`}>
                            {step > s ? <Check size={20} /> : s}
                        </div>
                        <span className={`text-xs mt-2 font-medium ${step >= s ? 'text-cyan-400' : 'text-slate-600'}`}>
                            {s === 1 ? 'Basics' : s === 2 ? 'Logistics' : s === 3 ? 'Details' : 'Confirm'}
                        </span>
                    </div>
                ))}
            </div>
            {/* Progress Bar Background */}
            <div className="absolute top-[170px] left-0 w-full md:w-[896px] h-1 bg-[#1A1F2E] -z-0 rounded-full mx-auto md:ml-0 overflow-hidden">
                 <div 
                    className="h-full bg-cyan-500 transition-all duration-500 ease-out" 
                    style={{ width: `${((step - 1) / 3) * 100}%` }}
                 ></div>
            </div>
        </div>

        <div className="bg-[#151A23] rounded-2xl shadow-xl border border-white/5 p-8 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>

            {step === 1 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-6"><Package className="text-cyan-400"/> Basic Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <Label>Shipment Title</Label>
                            <Input value={data.title} onChange={e=>setData({...data, title: e.target.value})} placeholder="e.g. Electronics Batch A" />
                        </div>
                         <div>
                            <Label>Category</Label>
                            <Select value={data.category} onChange={e=>setData({...data, category: e.target.value})}>
                                <option>General</option>
                                <option>Electronics</option>
                                <option>Perishable</option>
                                <option>Fragile</option>
                            </Select>
                        </div>
                        <div className="md:col-span-2">
                             <Label>Description</Label>
                             <textarea className="w-full bg-[#0B0E14] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all placeholder-slate-600" rows={3} value={data.description} onChange={e=>setData({...data, description: e.target.value})} />
                        </div>
                        <div>
                            <Label>Shipment Type</Label>
                            <Select value={data.type} onChange={e=>setData({...data, type: e.target.value})}>
                                <option>Standard</option>
                                <option>Express</option>
                                <option>Overnight</option>
                            </Select>
                        </div>
                    </div>
                </div>
            )}

            {step === 2 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-6"><Truck className="text-cyan-400"/> Addresses & Dates</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <Label>Receiver Wallet Address (KYC Verified)</Label>
                            <Input className="font-mono text-cyan-300" placeholder="0x..." value={data.receiver} onChange={e=>setData({...data, receiver: e.target.value})} />
                        </div>
                        <div className="md:col-span-2">
                            <Label>Courier Wallet Address</Label>
                            <Input className="font-mono text-cyan-300" placeholder="0x..." value={data.courier} onChange={e=>setData({...data, courier: e.target.value})} />
                        </div>
                        <div>
                            <Label>Pickup Date</Label>
                            <Input type="date" value={data.pickupDate} onChange={e=>setData({...data, pickupDate: e.target.value})} />
                        </div>
                         <div>
                            <Label>Estimated Delivery</Label>
                            <Input type="date" value={data.deliveryDate} onChange={e=>setData({...data, deliveryDate: e.target.value})} />
                        </div>
                    </div>
                </div>
            )}

             {step === 3 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-6"><DollarSign className="text-cyan-400"/> Details & Uploads</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <Label>Weight (kg)</Label>
                            <Input type="number" value={data.weight} onChange={e=>setData({...data, weight: e.target.value})} />
                        </div>
                        <div>
                            <Label>Dimensions (cm)</Label>
                            <Input type="text" placeholder="L x W x H" value={data.dim} onChange={e=>setData({...data, dim: e.target.value})} />
                        </div>
                         <div>
                            <Label>Price (ETH)</Label>
                            <Input type="number" step="0.001" value={data.price} onChange={e=>setData({...data, price: e.target.value})} />
                        </div>
                    </div>
                    <div className="border-2 border-dashed border-white/10 rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-white/5 hover:border-cyan-500/30 transition-all group">
                        <div className="p-4 bg-[#0B0E14] rounded-full mb-3 group-hover:scale-110 transition-transform">
                            <UploadCloud className="text-slate-400 group-hover:text-cyan-400" size={32} />
                        </div>
                        <span className="text-sm font-medium text-slate-300">Upload Product Images & Documents</span>
                        <span className="text-xs text-slate-500 mt-2">PDF, PNG, JPG up to 10MB</span>
                    </div>
                </div>
            )}

            {step === 4 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    <h2 className="text-xl font-bold text-white mb-6">Review & Confirm Transaction</h2>
                    
                    <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4 flex items-start gap-3 mb-6">
                        <Lock className="text-orange-400 shrink-0 mt-0.5" size={18} />
                        <div>
                            <h4 className="text-sm font-bold text-orange-400">Smart Contract Escrow</h4>
                            <p className="text-xs text-orange-200/80 mt-1">Upon creation, <span className="font-bold text-white">{data.price} ETH</span> will be deducted from your wallet and locked in the smart contract. These funds will be automatically released to the Courier/Seller once the status is updated to Delivered.</p>
                        </div>
                    </div>

                    <div className="bg-[#0B0E14] p-6 rounded-xl border border-white/5 space-y-4 text-sm">
                        <ReviewRow label="Title" value={data.title} />
                        <ReviewRow label="Receiver" value={data.receiver} isMono />
                        <ReviewRow label="Courier" value={data.courier} isMono />
                        <ReviewRow label="Price" value={`${data.price} ETH`} isHighlight />
                        <ReviewRow label="Estimated Delivery" value={data.deliveryDate} />
                    </div>
                </div>
            )}

            {/* Actions */}
            <div className="flex justify-between mt-10 pt-6 border-t border-white/5">
                {step > 1 ? (
                    <button onClick={handleBack} className="px-6 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 font-medium transition-colors">Back</button>
                ) : <div></div>}
                
                {step < 4 ? (
                     <button onClick={handleNext} className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/20 flex items-center">
                        Next Step <ChevronRight size={18} className="ml-2" />
                     </button>
                ) : (
                     <button onClick={handleSubmit} disabled={loading} className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white px-10 py-3 rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/20">
                        {loading ? 'Processing Transaction...' : 'Pay & Create Contract'}
                     </button>
                )}
            </div>
        </div>
    </div>
  );
};