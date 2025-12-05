import React, { useState } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { KYCStatus, UserProfile, UserRole } from '../types';
import * as BlockchainService from '../services/blockchain';
import { ShieldCheck, Upload, AlertCircle, CheckCircle, Clock, Lock } from 'lucide-react';

const Label = ({children}: {children?: React.ReactNode}) => <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-2 ml-1">{children}</label>

const Input = (props: any) => (
    <input className={`w-full bg-[#0B0E14] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all placeholder-slate-600 ${props.className}`} {...props} />
)

const UploadBox = ({title, subtitle}: any) => (
    <div className="border-2 border-dashed border-white/10 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:bg-white/5 hover:border-indigo-500/30 transition-all cursor-pointer group">
        <Upload className="text-slate-500 mb-2 group-hover:text-indigo-400" />
        <span className="text-sm font-bold text-slate-300">{title}</span>
        <span className="text-xs text-slate-500 mt-1">{subtitle}</span>
    </div>
)

export const KYCPage: React.FC = () => {
  const { userProfile, refreshData, account } = useWeb3();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account) return;
    setIsSubmitting(true);
    
    const updatedProfile: UserProfile = {
        walletAddress: account,
        name: formData.name,
        email: formData.email,
        role: userProfile?.role || UserRole.BUYER, 
        kycStatus: KYCStatus.PENDING,
        kycDocuments: {
            idDoc: 'ipfs://QmHash1...',
            addressProof: 'ipfs://QmHash2...'
        }
    };

    await BlockchainService.registerUser(updatedProfile);
    await refreshData();
    setIsSubmitting(false);
  };

  const StatusBanner = ({ status }: { status: KYCStatus }) => {
    const configs = {
        [KYCStatus.NOT_STARTED]: { color: 'bg-slate-500/10 border-slate-500/20', icon: Lock, text: 'text-slate-400', msg: 'Verification Required' },
        [KYCStatus.PENDING]: { color: 'bg-orange-500/10 border-orange-500/20', icon: Clock, text: 'text-orange-400', msg: 'Verification Pending Review' },
        [KYCStatus.VERIFIED]: { color: 'bg-emerald-500/10 border-emerald-500/20', icon: ShieldCheck, text: 'text-emerald-400', msg: 'Account Verified' },
        [KYCStatus.REJECTED]: { color: 'bg-red-500/10 border-red-500/20', icon: AlertCircle, text: 'text-red-400', msg: 'Verification Rejected' }
    };

    const cfg = configs[status || KYCStatus.NOT_STARTED];
    const Icon = cfg.icon;

    return (
        <div className={`p-4 rounded-xl border ${cfg.color} flex items-center space-x-3 mb-8`}>
            <Icon className={cfg.text} />
            <span className={`font-bold ${cfg.text}`}>{cfg.msg}</span>
        </div>
    );
  };

  if (userProfile?.kycStatus === KYCStatus.VERIFIED || userProfile?.kycStatus === KYCStatus.PENDING) {
     return (
        <div className="max-w-2xl mx-auto pt-10">
             <h1 className="text-3xl font-bold text-white mb-6">KYC Status</h1>
             <StatusBanner status={userProfile.kycStatus} />
             
             <div className="bg-[#151A23] p-12 rounded-2xl shadow-2xl border border-white/5 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-cyan-500"></div>
                <div className={`mx-auto h-24 w-24 rounded-full flex items-center justify-center mb-6 ${userProfile.kycStatus === KYCStatus.VERIFIED ? 'bg-emerald-500/10 text-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)]' : 'bg-orange-500/10 text-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.2)]'}`}>
                    {userProfile.kycStatus === KYCStatus.VERIFIED ? <CheckCircle size={48} /> : <Clock size={48} />}
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">
                    {userProfile.kycStatus === KYCStatus.VERIFIED ? "Identity Confirmed" : "Under Review"}
                </h3>
                <p className="text-slate-400 max-w-sm mx-auto">
                    {userProfile.kycStatus === KYCStatus.VERIFIED 
                        ? "You have full access to create shipments and participate in the decentralized supply chain." 
                        : "Our admin team is currently reviewing your submitted documents. This usually takes 1-24 hours."}
                </p>
             </div>
        </div>
     );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Identity Verification (KYC)</h1>
        <p className="text-slate-400 mt-2">To comply with decentralized regulations, please verify your identity.</p>
      </div>

      <StatusBanner status={KYCStatus.NOT_STARTED} />

      <form onSubmit={handleSubmit} className="bg-[#151A23] rounded-2xl shadow-xl border border-white/5 p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <Label>Full Name</Label>
                <Input 
                    required
                    value={formData.name}
                    onChange={(e:any) => setFormData({...formData, name: e.target.value})}
                />
            </div>
            <div>
                <Label>Email Address</Label>
                <Input 
                    required
                    type="email" 
                    value={formData.email}
                    onChange={(e:any) => setFormData({...formData, email: e.target.value})}
                />
            </div>
             <div>
                <Label>Phone Number</Label>
                <Input 
                    required
                    type="tel" 
                    value={formData.phone}
                    onChange={(e:any) => setFormData({...formData, phone: e.target.value})}
                />
            </div>
             <div>
                <Label>National ID Number</Label>
                <Input 
                    required
                    placeholder="Passport / Voter ID"
                />
            </div>
        </div>

        <div>
            <Label>Residential Address</Label>
            <textarea 
                required
                className="w-full bg-[#0B0E14] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all placeholder-slate-600"
                rows={3}
                value={formData.address}
                onChange={e => setFormData({...formData, address: e.target.value})}
            ></textarea>
        </div>

        <div className="border-t border-white/5 pt-6">
            <h3 className="font-bold text-white mb-4">Document Uploads</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <UploadBox title="Upload ID Document" subtitle="Passport or National ID (PDF)" />
                <UploadBox title="Proof of Address" subtitle="Utility Bill or Bank Statement" />
            </div>
        </div>

        <div className="flex justify-end pt-4">
            <button 
                type="submit" 
                disabled={isSubmitting}
                className={`bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-indigo-600/20 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
                {isSubmitting ? 'Submitting...' : 'Submit Verification'}
            </button>
        </div>
      </form>
    </div>
  );
};