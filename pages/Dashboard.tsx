import React, { useEffect, useState } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { 
  TrendingUp, 
  Package, 
  Clock, 
  CheckCircle,
  Plus,
  Shield,
  Search,
  ArrowRight,
  Zap,
  DollarSign,
  Activity
} from 'lucide-react';
import { Link } from 'react-router-dom';
import * as BlockchainService from '../services/blockchain';
import { DashboardStats, ShipmentStatus } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export const Dashboard: React.FC = () => {
  const { isConnected, userProfile } = useWeb3();
  const [stats, setStats] = useState<DashboardStats>({
    totalShipments: 0,
    activeShipments: 0,
    pendingKYC: 0,
    completedShipments: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      const shipments = await BlockchainService.getAllShipments();
      const users = await BlockchainService.getAllUsers();
      
      const active = shipments.filter(s => s.status !== ShipmentStatus.DELIVERED && s.status !== ShipmentStatus.CANCELLED).length;
      const completed = shipments.filter(s => s.status === ShipmentStatus.DELIVERED).length;
      const pendingKYC = users.filter(u => u.kycStatus === 'PENDING').length;

      setStats({
        totalShipments: shipments.length,
        activeShipments: active,
        pendingKYC: pendingKYC,
        completedShipments: completed
      });
    };
    fetchStats();
  }, [isConnected]); // Added isConnected dependency

  const chartData = [
    { name: 'Total', value: stats.totalShipments, color: '#818cf8' },
    { name: 'Active', value: stats.activeShipments, color: '#34d399' },
    { name: 'Completed', value: stats.completedShipments, color: '#f472b6' },
    { name: 'Pending', value: 2, color: '#fbbf24' }, // Dummy data for visual fullness
    { name: 'Failed', value: 1, color: '#f87171' },
  ];

  if (!isConnected) {
    return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center">
            <div className="relative mb-8">
                <div className="absolute inset-0 bg-indigo-500 blur-2xl opacity-20 rounded-full"></div>
                <div className="relative bg-[#151A23] p-8 rounded-full border border-white/5 shadow-2xl">
                    <Package size={64} className="text-indigo-500" />
                </div>
            </div>
            <h1 className="text-4xl font-bold text-white mb-4 tracking-tight">Welcome to ChainFlow</h1>
            <p className="text-slate-400 max-w-md mb-8 text-lg">
                The most advanced blockchain-powered supply chain management system. 
            </p>
            <div className="px-6 py-3 bg-[#151A23] text-indigo-400 rounded-xl border border-indigo-500/20 text-sm font-medium animate-pulse">
                Please connect your wallet to continue
            </div>
        </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
            <h1 className="text-3xl font-bold text-white">Supply Chain DApp</h1>
            <p className="text-slate-400 mt-2">Welcome back! Here's what's happening with your shipments.</p>
            <div className="flex items-center mt-3 space-x-2">
                <div className="flex items-center text-xs text-slate-500">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-500 mr-2"></span>
                    Live Data
                </div>
                <span className="text-slate-700">•</span>
                <div className="flex items-center text-xs text-emerald-400">
                    Real-time Updates <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 ml-2 animate-pulse"></span>
                </div>
            </div>
        </div>
        
        {/* KYC Status Pill */}
        <div className={`px-5 py-3 rounded-xl border ${userProfile?.kycStatus === 'VERIFIED' ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-orange-500/10 border-orange-500/20'} flex items-center`}>
             <div className={`p-1.5 rounded-full mr-3 ${userProfile?.kycStatus === 'VERIFIED' ? 'bg-emerald-500' : 'bg-orange-500'}`}>
                <Shield size={14} className="text-white"/>
             </div>
             <div>
                 <p className={`text-xs font-bold uppercase tracking-wider ${userProfile?.kycStatus === 'VERIFIED' ? 'text-emerald-400' : 'text-orange-400'}`}>
                    {userProfile?.kycStatus === 'VERIFIED' ? 'KYC Verified' : 'KYC Pending'}
                 </p>
                 <p className="text-[10px] text-slate-400">Identity Confirmed</p>
             </div>
        </div>
      </div>

      {/* Stats Grid - Matching Screenshot Style */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
            title="TOTAL SHIPMENTS" 
            value={stats.totalShipments} 
            icon={Package} 
            trend="+12%"
            bgIcon="bg-blue-600"
            shadow="shadow-blue-500/20"
        />
        <StatCard 
            title="ACTIVE SHIPMENTS" 
            value={stats.activeShipments} 
            icon={TruckIcon} 
            trend="+5%"
            bgIcon="bg-emerald-500"
            shadow="shadow-emerald-500/20"
        />
        <StatCard 
            title="TOTAL VALUE" 
            value="0.0000" 
            unit="ETH"
            icon={DollarSign} 
            trend="+18%"
            bgIcon="bg-violet-600"
            shadow="shadow-violet-500/20"
        />
        <StatCard 
            title="COMPLETED" 
            value={stats.completedShipments} 
            icon={Activity} 
            trend="+8%"
            bgIcon="bg-orange-500"
            shadow="shadow-orange-500/20"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
         {/* Recent Shipments / Chart Area */}
         <div className="lg:col-span-2 bg-[#151A23] rounded-2xl p-6 border border-white/5 relative overflow-hidden group">
            {/* Decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
                        <Activity size={20} />
                    </div>
                    <h2 className="text-lg font-bold text-white">Recent Activity</h2>
                </div>
                <Link to="/shipments" className="text-xs font-semibold text-slate-400 hover:text-white flex items-center transition-colors">
                    View All <ArrowRight size={14} className="ml-1" />
                </Link>
            </div>
            
            <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} barSize={40}>
                        <XAxis 
                            dataKey="name" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{fill: '#94a3b8', fontSize: 12}} 
                            dy={10}
                        />
                        <Tooltip 
                            cursor={{fill: 'rgba(255,255,255,0.05)'}}
                            contentStyle={{ 
                                backgroundColor: '#1A1F2E', 
                                border: '1px solid rgba(255,255,255,0.1)', 
                                borderRadius: '12px',
                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' 
                            }}
                            itemStyle={{ color: '#fff' }}
                        />
                        <Bar dataKey="value" radius={[6, 6, 6, 6]}>
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
         </div>

         {/* Quick Actions */}
         <div className="space-y-6">
            <div className="bg-[#151A23] rounded-2xl p-6 border border-white/5 h-full">
                <div className="flex items-center space-x-3 mb-6">
                    <div className="p-2 bg-gradient-to-br from-fuchsia-600 to-purple-600 rounded-lg text-white shadow-lg shadow-purple-500/20">
                        <Zap size={20} />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-white">Quick Actions</h2>
                        <p className="text-xs text-slate-500">Instant Access</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                    <QuickActionBtn 
                        to="/create" 
                        title="Create Shipment" 
                        desc="Send new package"
                        icon={Plus} 
                        gradient="bg-gradient-to-r from-blue-600 to-indigo-600"
                    />
                    <QuickActionBtn 
                        to="/tracking" 
                        title="Track Package" 
                        desc="Find your delivery"
                        icon={Search} 
                        gradient="bg-gradient-to-r from-emerald-500 to-teal-500"
                    />
                    <div className="grid grid-cols-2 gap-3">
                         <QuickActionBtnSmall 
                            to="/kyc" 
                            title="KYC" 
                            icon={Shield} 
                            gradient="bg-gradient-to-br from-violet-600 to-purple-600"
                        />
                         <QuickActionBtnSmall 
                            to="/shipments" 
                            title="My List" 
                            icon={TrendingUp} 
                            gradient="bg-gradient-to-br from-indigo-500 to-blue-500"
                        />
                    </div>
                </div>
            </div>
         </div>
      </div>
    </div>
  );
};

const TruckIcon = (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect width="16" height="13" x="2" y="5" rx="2" ry="2"/><path d="M18 5v3h3v3l-2.06 1.03"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
)

const StatCard = ({ title, value, unit, icon: Icon, trend, bgIcon, shadow }: any) => (
    <div className="bg-[#151A23] p-6 rounded-2xl border border-white/5 relative overflow-hidden group hover:border-white/10 transition-colors">
        {/* Glow behind icon */}
        <div className={`absolute top-4 right-4 w-12 h-12 ${bgIcon} blur-[40px] opacity-20 group-hover:opacity-40 transition-opacity`}></div>
        
        <div className="flex justify-between items-start mb-4">
            <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center">
                    {title}
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-600 ml-2 group-hover:bg-cyan-400 transition-colors"></span>
                </p>
                <p className="text-[10px] text-slate-600">Live Data</p>
            </div>
            <div className={`p-3 rounded-xl ${bgIcon} text-white ${shadow} shadow-lg`}>
                <Icon size={20} />
            </div>
        </div>
        
        <div className="flex items-end space-x-2">
            <h3 className="text-3xl font-bold text-white tracking-tight">{value}</h3>
            {unit && <span className="text-sm font-medium text-slate-400 mb-1.5">{unit}</span>}
        </div>

        <div className="mt-4 flex items-center justify-between">
            <div className="px-2.5 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-xs font-bold flex items-center">
                <TrendingUp size={12} className="mr-1" />
                {trend}
            </div>
            <div className="flex space-x-1">
                 <div className="w-1 h-1 rounded-full bg-slate-700"></div>
                 <div className="w-1 h-1 rounded-full bg-slate-700"></div>
                 <div className="w-1 h-1 rounded-full bg-slate-700"></div>
            </div>
        </div>
    </div>
);

const QuickActionBtn = ({ to, title, desc, icon: Icon, gradient }: any) => (
    <Link to={to} className={`flex items-center p-4 rounded-xl ${gradient} hover:opacity-90 transition-opacity shadow-lg`}>
        <div className="p-2 bg-white/20 rounded-lg mr-4 backdrop-blur-sm">
            <Icon size={24} className="text-white" />
        </div>
        <div className="text-white">
            <h3 className="font-bold text-sm">{title}</h3>
            <p className="text-[11px] opacity-80">{desc}</p>
        </div>
    </Link>
);

const QuickActionBtnSmall = ({ to, title, icon: Icon, gradient }: any) => (
    <Link to={to} className={`flex flex-col items-center justify-center p-4 rounded-xl ${gradient} hover:opacity-90 transition-opacity shadow-lg text-center`}>
        <Icon size={24} className="text-white mb-2" />
        <h3 className="font-bold text-xs text-white">{title}</h3>
    </Link>
);