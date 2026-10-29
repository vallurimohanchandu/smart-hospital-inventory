import React from 'react';
import { useLocation } from 'react-router-dom';
import { Menu, Calendar, Database, ShieldCheck } from 'lucide-react';

const PAGE_TITLES = {
  '/': { title: 'Hospital Executive Dashboard', breadcrumb: 'Overview' },
  '/inventory': { title: 'Medical Inventory Management', breadcrumb: 'Catalog' },
  '/movements': { title: 'Stock Movement Audit History', breadcrumb: 'Transactions' },
  '/suppliers': { title: 'Medical Suppliers Directory', breadcrumb: 'Vendors' },
  '/expiry': { title: 'Medication & Perishable Expiry Tracker', breadcrumb: 'Safety & Expiry' },
  '/reports': { title: 'Intelligent NoSQL Reports & Pipelines', breadcrumb: 'Aggregations' },
  '/project-info': { title: 'Course Project Architecture & Viva Guide', breadcrumb: 'Academic Specs' },
};

export default function Header({ onToggleSidebar }) {
  const location = useLocation();
  const current = PAGE_TITLES[location.pathname] || { title: 'Hospital Inventory', breadcrumb: 'System' };
  
  const todayFormatted = new Date().toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200 px-6 py-4 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Mobile hamburger & Titles */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
              <span>Smart Hospital</span>
              <span>/</span>
              <span className="text-teal-700">{current.breadcrumb}</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 leading-tight">
              {current.title}
            </h1>
          </div>
        </div>

        {/* Right: Date, System status */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
            <Calendar className="w-4 h-4 text-teal-600" />
            <span>{todayFormatted}</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg">
            <Database className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden md:inline">MongoDB 8.x Active</span>
            <span className="md:hidden">Active</span>
          </div>
        </div>
      </div>
    </header>
  );
}
