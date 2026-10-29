import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  ArrowLeftRight, 
  Truck, 
  AlertTriangle, 
  BarChart3, 
  Info,
  Activity,
  X
} from 'lucide-react';

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/inventory', label: 'Inventory', icon: Package },
  { path: '/movements', label: 'Stock Movements', icon: ArrowLeftRight },
  { path: '/suppliers', label: 'Suppliers', icon: Truck },
  { path: '/expiry', label: 'Expiry Management', icon: AlertTriangle },
  { path: '/reports', label: 'Reports & Analytics', icon: BarChart3 },
  { path: '/project-info', label: 'Project Information', icon: Info },
];

export default function Sidebar({ isOpen, onClose }) {
  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside className={`
        fixed top-0 bottom-0 left-0 z-50 w-72 bg-navy-900 text-white flex flex-col
        transition-transform duration-300 ease-in-out border-r border-slate-800
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Brand / Logo */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-teal-500/20">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight tracking-tight text-white">Smart Hospital</h1>
              <p className="text-xs text-teal-400 font-medium">Inventory Intelligence</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="lg:hidden text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Academic Course Badge */}
        <div className="px-6 py-3 bg-slate-800/50 border-b border-slate-800/80">
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span className="font-semibold text-teal-300">Course CSE494</span>
            <span className="bg-teal-900/60 text-teal-200 px-2 py-0.5 rounded text-[10px] font-mono border border-teal-700/40">MongoDB NoSQL</span>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                onClick={() => onClose && onClose()}
                className={({ isActive }) => `
                  flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
                  ${isActive 
                    ? 'bg-gradient-to-r from-teal-600 to-teal-700 text-white shadow-md shadow-teal-900/40 font-semibold' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/70'}
                `}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* System & DB Status footer */}
        <div className="p-4 border-t border-slate-800 bg-navy-950/40">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
            <div className="text-xs">
              <p className="font-medium text-slate-200">Database: SmartHospitalDB</p>
              <p className="text-[11px] text-slate-400">PyMongo Connected</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
