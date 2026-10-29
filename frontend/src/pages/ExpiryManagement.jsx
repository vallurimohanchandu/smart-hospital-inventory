import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  Clock, 
  Calendar, 
  ShieldAlert, 
  CheckCircle2, 
  AlertOctagon, 
  Filter, 
  Info,
  BadgeIndianRupee
} from 'lucide-react';

import { InventoryAPI, ReportsAPI } from '../services/api';
import { formatCurrency, formatDate } from '../utils/formatters';
import { ExpiryBadge, CategoryBadge, StockStatusBadge } from '../components/common/Badge';
import { LoadingSpinner, EmptyState, AlertBanner } from '../components/common/Feedback';

export default function ExpiryManagement() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');
  const [expiredReport, setExpiredReport] = useState(null);
  const [notification, setNotification] = useState(null);

  const fetchExpiryData = async () => {
    try {
      setLoading(true);
      const [invRes, expRes] = await Promise.all([
        InventoryAPI.getAll({
          limit: 100,
          sort_by: 'expiry_date',
          sort_order: 'asc',
          expiry_status: activeTab !== 'All' ? activeTab : undefined,
        }),
        ReportsAPI.getExpired(),
      ]);
      setItems(invRes.items || []);
      setExpiredReport(expRes.data || []);
    } catch (err) {
      setNotification({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpiryData();
  }, [activeTab]);

  const tabs = [
    { id: 'All', label: 'All Hospital Items' },
    { id: 'Expired', label: 'Expired (Quarantined)', badge: expiredReport?.length },
    { id: 'Expiring in 7 Days', label: '≤ 7 Days Critical' },
    { id: 'Expiring in 30 Days', label: '≤ 30 Days Warning' },
    { id: 'Expiring in 90 Days', label: '≤ 90 Days Routine' },
    { id: 'Non-Expiring', label: 'Non-Expiring Equipment' },
  ];

  const totalExpiredLoss = (expiredReport || []).reduce(
    (acc, curr) => acc + (curr.loss_valuation || 0),
    0
  );

  return (
    <div className="space-y-6">
      {notification && (
        <AlertBanner
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      {/* Clinical Safety Disclaimer Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900 leading-relaxed">
          <span className="font-bold">Academic Healthcare Demonstration Notice:</span> This application is built for academic evaluation (Course CSE494). It demonstrates NoSQL expiry date queries and stock-out prevention rules. Expired medications are automatically blocked from outwards dispatch workflows.
        </div>
      </div>

      {/* Summary KPI Cards for Expiry Tracking */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-rose-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-rose-600 uppercase tracking-wider block">Expired Medications</span>
            <span className="text-2xl font-black text-rose-900 mt-1 block">{expiredReport?.length || 0} Batches</span>
            <span className="text-xs text-rose-500">Immediate disposal / quarantine required</span>
          </div>
          <div className="p-3 rounded-xl bg-rose-50 text-rose-600">
            <AlertOctagon className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-amber-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-amber-600 uppercase tracking-wider block">Potential Financial Loss</span>
            <span className="text-2xl font-black text-amber-900 mt-1 block">{formatCurrency(totalExpiredLoss)}</span>
            <span className="text-xs text-amber-500">Aggregated valuation of expired items</span>
          </div>
          <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
            <BadgeIndianRupee className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-teal-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-teal-600 uppercase tracking-wider block">Safety Policy Active</span>
            <span className="text-2xl font-black text-teal-900 mt-1 block">STOCK_OUT Block</span>
            <span className="text-xs text-teal-600">Backend strictly prevents issuing expired drugs</span>
          </div>
          <div className="p-3 rounded-xl bg-teal-50 text-teal-600">
            <ShieldAlert className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === tab.id
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <span>{tab.label}</span>
            {tab.badge !== undefined && tab.badge > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeTab === tab.id ? 'bg-rose-500 text-white' : 'bg-rose-100 text-rose-800'
              }`}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Items Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <LoadingSpinner text="Querying medication expiry timelines from MongoDB..." />
        ) : items.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="No items in this expiry bracket"
              description="No inventory items match the selected expiry status category."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Item ID</th>
                  <th className="py-3.5 px-4">Item Name</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4 text-right">Stock</th>
                  <th className="py-3.5 px-4">Expiry Date</th>
                  <th className="py-3.5 px-4">Expiry Status</th>
                  <th className="py-3.5 px-4">Storage Location</th>
                  <th className="py-3.5 px-4 text-right">Line Valuation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {items.map((item) => (
                  <tr 
                    key={item.item_id} 
                    className={`transition-colors ${
                      item.expiry_status === 'Expired' 
                        ? 'bg-rose-50/40 hover:bg-rose-50/70' 
                        : item.expiry_status === 'Expiring in 7 Days'
                        ? 'bg-amber-50/30 hover:bg-amber-50/60'
                        : 'hover:bg-slate-50/70'
                    }`}
                  >
                    <td className="py-3.5 px-4 font-mono text-xs font-semibold text-slate-500">
                      #{item.item_id}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-900 block">{item.item_name}</span>
                      <span className="text-xs text-slate-400">{item.supplier_name || 'No supplier'}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <CategoryBadge category={item.category} />
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                      {item.quantity} units
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-700">
                      {formatDate(item.expiry_date)}
                    </td>
                    <td className="py-3.5 px-4">
                      <ExpiryBadge status={item.expiry_status} />
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600">
                      {item.location}
                    </td>
                    <td className="py-3.5 px-4 text-right font-semibold text-teal-700">
                      {formatCurrency(item.quantity * item.unit_price)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
