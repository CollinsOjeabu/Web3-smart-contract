import React, { useState } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  Send, 
  ShieldCheck, 
  Settings, 
  Menu, 
  X, 
  Wallet,
  Bell,
  Search,
  User,
  Sun,
  ShoppingBag,
  Store,
  Truck
} from 'lucide-react';
import { UserRole } from '../types';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isConnected, connect, disconnect, account, balance, userProfile, notifications, setDevRole } = useWeb3();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const NavItem = ({ path, icon: Icon, label }: { path: string; icon: any; label: string }) => (
    <Link
      to={path}
      onClick={() => setIsMobileMenuOpen(false)}
      className={`relative flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
        isActive(path)
          ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/10 text-white'
          : 'text-slate-400 hover:bg-white/5 hover:text-white'
      }`}
    >
      {isActive(path) && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-cyan-400 rounded-r-full shadow-[0_0_10px_rgba(34,211,238,0.5)]"></div>
      )}
      <Icon size={20} className={isActive(path) ? 'text-cyan-400 drop-shadow-sm' : 'group-hover:text-slate-200'} />
      <span className="font-medium">{label}</span>
    </Link>
  );

  const getRoleLabel = () => {
    if(!userProfile) return 'Guest';
    switch(userProfile.role) {
        case UserRole.ADMIN: return 'Administrator';
        case UserRole.SELLER: return 'Merchant / Seller';
        case UserRole.COURIER: return 'Logistics Partner';
        case UserRole.BUYER: return 'Customer';
        default: return 'User';
    }
  }

  return (
    <div className="flex h-screen bg-[#0B0E14] overflow-hidden">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#11141B] border-r border-white/5 transform transition-transform duration-200 ease-in-out lg:relative lg:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center p-6 h-24">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2 rounded-xl shadow-lg shadow-indigo-500/20">
                <Package className="text-white" size={24} />
            </div>
            <div>
                <span className="block text-xl font-bold tracking-tight text-white">SupplyChain</span>
                <span className="block text-[10px] text-slate-500 font-medium uppercase tracking-wider">Decentralized</span>
            </div>
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="lg:hidden text-slate-400 ml-auto">
            <X size={24} />
          </button>
        </div>

        <nav className="p-4 space-y-2 mt-2">
          {/* Common */}
          <NavItem path="/" icon={LayoutDashboard} label="Dashboard" />

          {/* Role: BUYER */}
          {(userProfile?.role === UserRole.BUYER || !isConnected) && (
            <>
                <NavItem path="/catalog" icon={ShoppingBag} label="Browse Catalog" />
                <NavItem path="/shipments" icon={Package} label="My Orders" />
                <NavItem path="/tracking" icon={Search} label="Track Order" />
            </>
          )}

          {/* Role: SELLER */}
          {userProfile?.role === UserRole.SELLER && (
             <>
                <NavItem path="/seller-studio" icon={Store} label="Seller Studio" />
                <NavItem path="/shipments" icon={Package} label="Sales Orders" />
                <NavItem path="/tracking" icon={Search} label="Track Shipment" />
             </>
          )}

          {/* Role: COURIER */}
          {userProfile?.role === UserRole.COURIER && (
             <>
                <NavItem path="/shipments" icon={Truck} label="Assigned Jobs" />
                <NavItem path="/tracking" icon={Search} label="Update Status" />
             </>
          )}

          {/* Common: KYC */}
          <NavItem path="/kyc" icon={ShieldCheck} label="KYC Verification" />

          {/* Role: ADMIN */}
          {userProfile?.role === UserRole.ADMIN && (
             <div className="pt-6 mt-4 border-t border-white/5">
                <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Administrator</p>
                <NavItem path="/admin" icon={Settings} label="Admin Console" />
                <NavItem path="/shipments" icon={Package} label="All Shipments" />
             </div>
          )}
        </nav>

        {/* Dev Tools for Role Switching */}
        {isConnected && (
            <div className="absolute bottom-0 w-full p-6 border-t border-white/5 bg-[#0F1219]">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        <p className="text-xs text-slate-400 font-medium">{getRoleLabel()}</p>
                    </div>
                    <span className="text-[10px] bg-white/5 text-slate-300 px-2 py-0.5 rounded border border-white/5">DevMode</span>
                </div>
                
                <div className="grid grid-cols-4 gap-1 p-1 bg-black/20 rounded-lg">
                    <button onClick={() => setDevRole(UserRole.BUYER)} title="Buyer" className={`text-[10px] py-1.5 rounded font-medium transition-colors ${userProfile?.role === UserRole.BUYER ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-white'}`}>Buy</button>
                    <button onClick={() => setDevRole(UserRole.SELLER)} title="Seller" className={`text-[10px] py-1.5 rounded font-medium transition-colors ${userProfile?.role === UserRole.SELLER ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-white'}`}>Sell</button>
                    <button onClick={() => setDevRole(UserRole.COURIER)} title="Courier" className={`text-[10px] py-1.5 rounded font-medium transition-colors ${userProfile?.role === UserRole.COURIER ? 'bg-orange-600 text-white' : 'text-slate-500 hover:text-white'}`}>Del</button>
                    <button onClick={() => setDevRole(UserRole.ADMIN)} title="Admin" className={`text-[10px] py-1.5 rounded font-medium transition-colors ${userProfile?.role === UserRole.ADMIN ? 'bg-red-600 text-white' : 'text-slate-500 hover:text-white'}`}>Adm</button>
                </div>
            </div>
        )}
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-96 bg-indigo-900/10 blur-[100px] pointer-events-none -z-10"></div>
        
        <header className="h-24 flex items-center justify-between px-6 lg:px-8 z-10">
          <div className="flex items-center lg:hidden">
             <button onClick={() => setIsMobileMenuOpen(true)} className="text-slate-400 mr-4">
                <Menu size={24} />
             </button>
             <span className="text-lg font-bold text-white">ChainFlow</span>
          </div>

          <div className="hidden lg:flex items-center flex-1 max-w-xl">
             <div className="relative w-full group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search size={18} className="text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
                </div>
                <input 
                    type="text" 
                    placeholder="Search shipments, tracking ID..." 
                    className="bg-[#151A23] border border-white/5 text-sm rounded-xl pl-10 pr-4 py-3 w-full text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all shadow-sm"
                />
             </div>
          </div>

          <div className="flex items-center space-x-5">
            <button className="p-2 text-slate-400 hover:text-yellow-400 transition-colors">
                <Sun size={20} />
            </button>
            
            <div className="relative">
                <button className="p-2 text-slate-400 hover:text-white transition-colors relative">
                    <Bell size={20} />
                    {notifications.length > 0 && (
                        <span className="absolute top-1 right-1.5 h-2 w-2 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.6)]"></span>
                    )}
                </button>
            </div>

            <div className="h-8 w-[1px] bg-white/10 mx-2"></div>

            {isConnected ? (
              <div className="flex items-center pl-1 pr-1 py-1 rounded-full bg-[#151A23] border border-white/5 shadow-lg">
                 <div className="px-3 flex flex-col items-end mr-2">
                     <span className="text-xs font-bold text-white tracking-wide font-mono">{account?.substring(0, 6)}...{account?.substring(account.length - 4)}</span>
                     <span className="text-[10px] text-slate-400">{balance.toFixed(4)} ETH</span>
                 </div>
                 <button onClick={disconnect} className="h-9 w-9 rounded-full bg-gradient-to-r from-fuchsia-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all">
                     <User size={16} />
                 </button>
              </div>
            ) : (
              <button onClick={connect} className="flex items-center space-x-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-6 py-3 rounded-full font-semibold text-sm transition-all shadow-lg shadow-indigo-500/25">
                <Wallet size={18} />
                <span>Connect Wallet</span>
              </button>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 lg:px-8 pb-20 scroll-smooth">
            <div className="max-w-7xl mx-auto">
                {children}
            </div>
        </main>
      </div>
    </div>
  );
};