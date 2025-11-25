import React, { useEffect, useState } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { UserRole, UserProfile, KYCStatus } from '../types';
import * as BlockchainService from '../services/blockchain';
import { Check, X, Shield, FileText, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const AdminPage: React.FC = () => {
  const { userProfile, refreshData } = useWeb3();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserProfile[]>([]);

  useEffect(() => {
    if (userProfile && userProfile.role !== UserRole.ADMIN) {
        navigate('/');
        return;
    }
    loadUsers();
  }, [userProfile]);

  const loadUsers = async () => {
    const all = await BlockchainService.getAllUsers();
    setUsers(all);
  };

  const handleKYC = async (address: string, status: KYCStatus) => {
    await BlockchainService.verifyKYC(address, status);
    loadUsers();
    refreshData(); 
  };

  const pendingUsers = users.filter(u => u.kycStatus === KYCStatus.PENDING);

  return (
    <div className="space-y-8">
        <div className="flex items-center space-x-4 bg-gradient-to-r from-red-900/20 to-pink-900/20 p-8 rounded-2xl border border-red-500/10">
            <div className="p-3 bg-red-500/10 rounded-xl text-red-500 border border-red-500/20">
                <Shield size={32} />
            </div>
            <div>
                <h1 className="text-2xl font-bold text-white">Admin Console</h1>
                <p className="text-red-300/70">Manage platform security, approve users, and monitor network activity.</p>
            </div>
        </div>

        <div>
            <h2 className="text-lg font-bold text-white mb-4 flex items-center">
                Pending KYC Requests 
                {pendingUsers.length > 0 && <span className="ml-3 bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full font-bold animate-pulse">{pendingUsers.length}</span>}
            </h2>

            <div className="grid gap-4">
                {pendingUsers.length === 0 ? (
                    <div className="p-12 text-center bg-[#151A23] rounded-2xl border border-white/5 text-slate-500">
                        <Check size={48} className="mx-auto mb-4 opacity-20" />
                        No pending KYC approvals.
                    </div>
                ) : pendingUsers.map(u => (
                    <div key={u.walletAddress} className="bg-[#151A23] p-6 rounded-2xl border border-white/5 shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-1">
                                <h3 className="font-bold text-white text-lg">{u.name}</h3>
                                <span className="bg-slate-800 text-slate-400 text-[10px] px-2 py-0.5 rounded font-mono border border-white/5">{u.walletAddress}</span>
                            </div>
                            <p className="text-sm text-slate-400">{u.email}</p>
                            <div className="flex mt-4 space-x-4">
                                <button className="text-xs flex items-center text-cyan-400 hover:text-cyan-300 font-medium bg-cyan-500/10 px-3 py-1.5 rounded-lg border border-cyan-500/20 transition-colors"><FileText size={14} className="mr-2"/> View ID Document</button>
                                <button className="text-xs flex items-center text-cyan-400 hover:text-cyan-300 font-medium bg-cyan-500/10 px-3 py-1.5 rounded-lg border border-cyan-500/20 transition-colors"><FileText size={14} className="mr-2"/> View Proof of Address</button>
                            </div>
                        </div>
                        <div className="flex space-x-3">
                            <button 
                                onClick={() => handleKYC(u.walletAddress, KYCStatus.REJECTED)}
                                className="flex items-center px-5 py-2.5 border border-red-500/30 text-red-500 rounded-xl hover:bg-red-500/10 text-sm font-bold transition-colors"
                            >
                                <X size={16} className="mr-2"/> Reject
                            </button>
                            <button 
                                onClick={() => handleKYC(u.walletAddress, KYCStatus.VERIFIED)}
                                className="flex items-center px-5 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-500 text-sm font-bold shadow-lg shadow-emerald-500/20 transition-colors"
                            >
                                <Check size={16} className="mr-2"/> Approve
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        <div className="pt-8 border-t border-white/5">
             <h2 className="text-lg font-bold text-white mb-4">All Registered Users</h2>
             <div className="bg-[#151A23] rounded-2xl border border-white/5 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-[#0F1219] border-b border-white/5">
                        <tr>
                            <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase">User</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase">Role</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase">KYC Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {users.map(u => (
                            <tr key={u.walletAddress} className="hover:bg-white/5 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="font-bold text-sm text-white">{u.name || 'Unknown'}</div>
                                    <div className="font-mono text-xs text-slate-500">{u.walletAddress}</div>
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-300">{u.role}</td>
                                <td className="px-6 py-4">
                                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide border ${u.kycStatus === KYCStatus.VERIFIED ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-slate-500/10 text-slate-500 border-slate-500/20'}`}>
                                        {u.kycStatus}
                                    </span>
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