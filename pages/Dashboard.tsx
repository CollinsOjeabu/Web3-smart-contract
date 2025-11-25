import React, { useEffect, useState } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { 
  TrendingUp, 
  Package, 
  Shield,
  ArrowRight,
  Zap,
  DollarSign,
  Activity,
  ShoppingBag,
  Store,
  CreditCard
} from 'lucide-react';
import { Link } from 'react-router-dom';
import * as BlockchainService from '../services/blockchain';
import { DashboardStats, ShipmentStatus, UserRole } from '../types';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export const Dashboard: React.FC = () => {
  const { isConnected, userProfile, account } = useWeb3();
  const [stats, setStats] = useState<DashboardStats>({
    totalShipments: 0,
    activeShipments: 0,
    pendingKYC: 0,
    completedShipments: 0,
    revenue: 0,
    spent: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      const shipments = await BlockchainService.getAllShipments();
      const users = await BlockchainService.getAllUsers();
      
      let relevantShipments = shipments;
      let revenue = 0;
      let spent = 0;

      if (userProfile?.role === UserRole.SELLER && account) {
          relevantShipments = shipments.filter(s => s.sender === account);
          // Calculate Revenue (Completed orders)
          revenue = relevantShipments
            .filter(s => s.status === ShipmentStatus.DELIVERED)
            .reduce((acc, curr) => acc + curr.price, 0);
      } else if (userProfile?.role === UserRole.BUYER && account) {
          relevantShipments = shipments.filter(s => s.receiver === account);
          // Calculate Spent
          spent = relevantShipments.reduce((acc, curr) => acc + curr.price, 0);
      }

      const active = relevantShipments.filter(s => s.status !== ShipmentStatus.DELIVERED && s.status !== ShipmentStatus.CANCELLED).length;
      const completed = relevantShipments.filter(s => s.status === ShipmentStatus.DELIVERED).length;
      const pendingKYC = users.filter(u => u.kycStatus === 'PENDING').length;

      setStats({
        totalShipments: relevantShipments.length,
        activeShipments: active,
        pendingKYC: pendingKYC,
        completedShipments: completed,
        revenue,
        spent
      });
    };
    fetchStats();
  }, [isConnected, userProfile]); 

  const chartData = [
    { name: 'Total', value: stats.totalShipments, color: '#818cf8' },
    { name: 'Active', value: stats.activeShipments, color: '#34d399' },
    { name: 'Completed', value: stats.completedShipments, color: '#f472b6' },
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

  const isSeller = userProfile?.role === UserRole.SELLER;
  const isBuyer = userProfile?.role === UserRole.BUYER;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
            <h1 className="text-3xl font-bold text-white">
                {isSeller ? 'Seller Dashboard' : isBuyer ? 'My Account' : 'Dashboard'}
            </h1>
            <p className="text-slate-400 mt-2">
                {isSeller ? 'Manage your sales and inventory.' : 'Track your orders and purchases.'}
            </p>
        </div>
        
        <div className={`px-5 py-3 rounded-xl border ${userProfile?.kycStatus === 'VERIFIED' ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-orange-500/10 border-orange-500/20'} flex items-center`}>
             <div className={`p-1.5 rounded-full mr-3 ${userProfile?.kycStatus === 'VERIFIED' ? 'bg-emerald-500' : 'bg-orange-500'}`}>
                <Shield size={14} className="text-white"/>
             </div>
             <div>
                 <p className={`text-xs font-bold uppercase tracking-wider ${userProfile?.kycStatus === 'VERIFIED' ? 'text-emerald-400' : 'text-orange-400'}`}>
                    {userProfile?.kycStatus === 'VERIFIED' ? 'KYC Verified' : 'KYC Pending'}
                 </p>
             </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
            title={isSeller ? "TOTAL SALES" : "TOTAL ORDERS"} 
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
            title={isSeller ? "TOTAL REVENUE" : "TOTAL SPENT"} 
            value={isSeller ? stats.revenue?.toFixed(3) : stats.spent?.toFixed(3)} 
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
         <div className="lg:col-span-2 bg-[#151A23] rounded-2xl p-6 border border-white/5 relative overflow-hidden group">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
                        <Activity size={20} />
                    </div>
                    <h2 className="text-lg font-bold text-white">Activity Overview</h2>
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
                                borderRadius: '12px' 
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
                    {isBuyer && (
                        <QuickActionBtn 
                            to="/catalog" 
                            title="Browse Catalog" 
                            desc="Buy Items"
                            icon={ShoppingBag} 
                            gradient="bg-gradient-to-r from-blue-600 to-indigo-600"
                        />
                    )}
                    {isSeller && (
                        <QuickActionBtn 
                            to="/seller-studio" 
                            title="Add Product" 
                            desc="Manage Inventory"
                            icon={Store} 
                            gradient="bg-gradient-to-r from-blue-600 to-indigo-600"
                        />
                    )}
                    <QuickActionBtn 
                        to="/tracking" 
                        title="Track Package" 
                        desc="Find your delivery"
                        icon={Shield} 
                        gradient="bg-gradient-to-r from-emerald-500 to-teal-500"
                    />
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
        <div className={`absolute top-4 right-4 w-12 h-12 ${bgIcon} blur-[40px] opacity-20 group-hover:opacity-40 transition-opacity`}></div>
        <div className="flex justify-between items-start mb-4">
            <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center">
                    {title}
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