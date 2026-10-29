import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Boxes, 
  AlertTriangle, 
  AlertOctagon, 
  Clock, 
  CalendarX, 
  BadgeIndianRupee, 
  Plus, 
  ArrowDownLeft, 
  ArrowUpRight, 
  RefreshCw, 
  TrendingUp 
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';

import { DashboardAPI, ReportsAPI, InventoryAPI, MovementsAPI, SuppliersAPI } from '../services/api';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import { StockStatusBadge, MovementTypeBadge, CategoryBadge } from '../components/common/Badge';
import { LoadingSpinner, AlertBanner } from '../components/common/Feedback';
import Modal from '../components/common/Modal';

const PIE_COLORS = ['#0d9488', '#0284c7', '#6366f1', '#f59e0b', '#ec4899'];

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [categoryData, setCategoryData] = useState([]);
  const [recentMovements, setRecentMovements] = useState([]);
  const [alerts, setAlerts] = useState({ low_stock: [], expired: [], near_expiry: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);

  // Quick Action Modals
  const [addItemModalOpen, setAddItemModalOpen] = useState(false);
  const [receiveStockModalOpen, setReceiveStockModalOpen] = useState(false);
  const [suppliersList, setSuppliersList] = useState([]);
  const [inventoryList, setInventoryList] = useState([]);

  // Form states
  const [newItem, setNewItem] = useState({
    item_id: '',
    item_name: '',
    category: 'Medicine',
    quantity: 10,
    minimum_stock: 5,
    unit_price: 10.0,
    location: '',
    supplier_id: '',
    expiry_date: '',
    description: '',
  });

  const [receiveForm, setReceiveForm] = useState({
    item_id: '',
    movement_type: 'STOCK_IN',
    quantity: 10,
    reason: 'Routine hospital ward restock',
    performed_by: 'Staff Pharmacist',
  });

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [statsRes, catRes, movRes, alertsRes] = await Promise.all([
        DashboardAPI.getStats(),
        ReportsAPI.getCategorySummary(),
        DashboardAPI.getRecentMovements(),
        DashboardAPI.getAlerts(),
      ]);

      setStats(statsRes);
      setCategoryData(catRes.data || []);
      setRecentMovements(movRes || []);
      setAlerts(alertsRes || { low_stock: [], expired: [], near_expiry: [] });
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const loadLookupData = async () => {
    try {
      const [suppRes, invRes] = await Promise.all([
        SuppliersAPI.getAll({ limit: 100 }),
        InventoryAPI.getAll({ limit: 100 }),
      ]);
      setSuppliersList(suppRes.suppliers || []);
      setInventoryList(invRes.items || []);
    } catch {
      // Lookup fallback
    }
  };

  useEffect(() => {
    fetchDashboardData();
    loadLookupData();
  }, []);

  const handleCreateItemSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...newItem,
        item_id: parseInt(newItem.item_id),
        quantity: parseInt(newItem.quantity),
        minimum_stock: parseInt(newItem.minimum_stock),
        unit_price: parseFloat(newItem.unit_price),
        supplier_id: newItem.supplier_id ? parseInt(newItem.supplier_id) : null,
        expiry_date: newItem.expiry_date ? newItem.expiry_date : null,
      };
      await InventoryAPI.create(payload);
      setNotification({ type: 'success', message: `Item #${payload.item_id} (${payload.item_name}) created successfully!` });
      setAddItemModalOpen(false);
      setNewItem({
        item_id: '',
        item_name: '',
        category: 'Medicine',
        quantity: 10,
        minimum_stock: 5,
        unit_price: 10.0,
        location: '',
        supplier_id: '',
        expiry_date: '',
        description: '',
      });
      fetchDashboardData();
      loadLookupData();
    } catch (err) {
      setNotification({ type: 'error', message: err.message });
    }
  };

  const handleReceiveStockSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        item_id: parseInt(receiveForm.item_id),
        movement_type: 'STOCK_IN',
        quantity: parseInt(receiveForm.quantity),
        reason: receiveForm.reason,
        performed_by: receiveForm.performed_by,
      };
      await MovementsAPI.record(payload);
      setNotification({ type: 'success', message: `Recorded intake of ${payload.quantity} units for Item #${payload.item_id}!` });
      setReceiveStockModalOpen(false);
      fetchDashboardData();
    } catch (err) {
      setNotification({ type: 'error', message: err.message });
    }
  };

  if (loading && !stats) {
    return <LoadingSpinner text="Connecting to MongoDB and computing live hospital metrics..." />;
  }

  const kpis = [
    {
      title: 'Total Unique Items',
      value: stats?.total_unique_items ?? 0,
      icon: Package,
      color: 'teal',
      bg: 'bg-teal-50',
      textColor: 'text-teal-700',
      border: 'border-teal-200',
    },
    {
      title: 'Total Stock Units',
      value: (stats?.total_units ?? 0).toLocaleString(),
      icon: Boxes,
      color: 'blue',
      bg: 'bg-sky-50',
      textColor: 'text-sky-700',
      border: 'border-sky-200',
    },
    {
      title: 'Low-Stock Alerts',
      value: stats?.low_stock_items ?? 0,
      icon: AlertTriangle,
      color: 'amber',
      bg: 'bg-amber-50',
      textColor: 'text-amber-700',
      border: 'border-amber-200',
    },
    {
      title: 'Out of Stock',
      value: stats?.out_of_stock_items ?? 0,
      icon: AlertOctagon,
      color: 'rose',
      bg: 'bg-rose-50',
      textColor: 'text-rose-700',
      border: 'border-rose-200',
    },
    {
      title: 'Expired Drugs',
      value: stats?.expired_medicines ?? 0,
      icon: Clock,
      color: 'red',
      bg: 'bg-red-50',
      textColor: 'text-red-700',
      border: 'border-red-200',
    },
    {
      title: 'Expiring ≤ 30 Days',
      value: stats?.expiring_30_days ?? 0,
      icon: CalendarX,
      color: 'orange',
      bg: 'bg-orange-50',
      textColor: 'text-orange-700',
      border: 'border-orange-200',
    },
    {
      title: 'Total Valuation',
      value: formatCurrency(stats?.total_inventory_valuation ?? 0),
      icon: BadgeIndianRupee,
      color: 'emerald',
      bg: 'bg-emerald-50',
      textColor: 'text-emerald-700',
      border: 'border-emerald-200',
      colSpan: 'sm:col-span-2 lg:col-span-1',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Top Banner Alert / Notifications */}
      {notification && (
        <AlertBanner
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}
      {error && <AlertBanner type="error" message={error} />}

      {/* Header Bar with Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            Real-Time Hospital Inventory Metrics
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Aggregated dynamically from MongoDB collection <code className="text-teal-700 font-mono font-semibold">SmartHospitalDB.inventory</code>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={fetchDashboardData}
            className="p-2.5 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors border border-slate-200 flex items-center gap-1.5 text-xs font-semibold"
            title="Refresh Metrics"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden md:inline">Refresh</span>
          </button>
          <button
            onClick={() => setReceiveStockModalOpen(true)}
            className="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm transition-colors"
          >
            <ArrowDownLeft className="w-4 h-4" />
            Receive Stock
          </button>
          <button
            onClick={() => setAddItemModalOpen(true)}
            className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm shadow-teal-600/20 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Inventory Item
          </button>
        </div>
      </div>

      {/* 7 KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className={`p-4 rounded-2xl bg-white border ${kpi.border} shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between ${kpi.colSpan || ''}`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider line-clamp-1">
                  {kpi.title}
                </span>
                <div className={`p-2 rounded-xl ${kpi.bg} ${kpi.textColor}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div>
                <p className={`text-xl font-extrabold ${kpi.textColor} tracking-tight`}>
                  {kpi.value}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Breakdown Bar Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Category-Wise Valuation & Units</h3>
              <p className="text-xs text-slate-500">Aggregation Pipeline ($group by category)</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-teal-700 bg-teal-50 px-2.5 py-1 rounded-lg">
              <TrendingUp className="w-3.5 h-3.5" />
              Live MongoDB Data
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <XAxis dataKey="category" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(val, name) => [
                    name === 'total_valuation' ? formatCurrency(val) : val,
                    name === 'total_valuation' ? 'Valuation' : 'Quantity Units'
                  ]}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', border: 'none' }}
                />
                <Legend />
                <Bar dataKey="total_valuation" fill="#0d9488" name="Total Valuation (₹)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="total_quantity" fill="#0284c7" name="Total Units" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Stock Distribution Pie Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Inventory Distribution</h3>
            <p className="text-xs text-slate-500 mb-4">By Product Category</p>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    dataKey="item_count"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={50}
                    paddingAngle={4}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', border: 'none' }}
                    formatter={(val) => [`${val} Items`, 'Documents']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-slate-100">
            {categoryData.map((cat, i) => (
              <div key={cat.category} className="p-1.5 rounded-lg bg-slate-50">
                <span className="text-[10px] text-slate-500 block truncate">{cat.category}</span>
                <span className="text-xs font-bold text-slate-800">{cat.item_count} items</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Alerts & Critical Stock Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low-Stock & Out-of-Stock Alerts Panel */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Stock Replenishment Alerts</h3>
                <p className="text-xs text-slate-500">Items at or below safe reorder thresholds</p>
              </div>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800">
              {alerts.low_stock.length} Attention Needed
            </span>
          </div>

          <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto pr-1">
            {alerts.low_stock.length === 0 ? (
              <p className="text-sm text-slate-500 py-6 text-center">All inventory levels are optimal.</p>
            ) : (
              alerts.low_stock.map((item) => (
                <div key={item.item_id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{item.item_name}</p>
                    <p className="text-xs text-slate-500">ID: #{item.item_id} • Location: {item.location}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                      item.quantity === 0 ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {item.quantity} in stock (Min: {item.minimum_stock})
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Expiry Risk Alerts Panel */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-rose-50 text-rose-700">
                <AlertOctagon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Expiry Risk Alerts</h3>
                <p className="text-xs text-slate-500">Perishables requiring immediate hospital audit</p>
              </div>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-100 text-rose-800">
              {alerts.expired.length + alerts.near_expiry.length} Tracked
            </span>
          </div>

          <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto pr-1">
            {alerts.expired.length === 0 && alerts.near_expiry.length === 0 ? (
              <p className="text-sm text-slate-500 py-6 text-center">No medicines are expired or nearing expiry.</p>
            ) : (
              <>
                {alerts.expired.map((item) => (
                  <div key={item.item_id} className="py-3 flex items-center justify-between gap-3 bg-rose-50/40 px-2 rounded-lg mb-1">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-rose-900 truncate">{item.item_name}</p>
                      <p className="text-xs text-rose-600">Expired: {item.expiry_date} • {item.quantity} units remaining</p>
                    </div>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-rose-200 text-rose-900">
                      EXPIRED
                    </span>
                  </div>
                ))}
                {alerts.near_expiry.map((item) => (
                  <div key={item.item_id} className="py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{item.item_name}</p>
                      <p className="text-xs text-slate-500">Expiring: {item.expiry_date} • {item.location}</p>
                    </div>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800">
                      Expiring Soon
                    </span>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Recent Stock Movements Table */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Recent Stock Movements</h3>
            <p className="text-xs text-slate-500">Audit trail of latest inventory transactions</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Tx ID</th>
                <th className="py-3 px-4">Item</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Quantity</th>
                <th className="py-3 px-4">Stock Transition</th>
                <th className="py-3 px-4">Reason</th>
                <th className="py-3 px-4">Logged By</th>
                <th className="py-3 px-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {recentMovements.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-slate-500">
                    No movements logged yet.
                  </td>
                </tr>
              ) : (
                recentMovements.map((mov) => (
                  <tr key={mov.movement_id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-500">#{mov.movement_id}</td>
                    <td className="py-3.5 px-4 font-medium text-slate-900">
                      {mov.item_name}
                      <span className="block text-xs text-slate-400">ID: #{mov.item_id}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <MovementTypeBadge type={mov.movement_type} />
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {mov.quantity} units
                    </td>
                    <td className="py-3.5 px-4 text-xs font-mono text-slate-600">
                      {mov.previous_quantity} &rarr; <span className="font-bold text-teal-700">{mov.new_quantity}</span>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600 max-w-xs truncate">{mov.reason}</td>
                    <td className="py-3.5 px-4 text-xs text-slate-700">{mov.performed_by}</td>
                    <td className="py-3.5 px-4 text-xs text-slate-400">{formatDateTime(mov.timestamp)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* QUICK ACTION: Add Inventory Modal */}
      <Modal
        isOpen={addItemModalOpen}
        onClose={() => setAddItemModalOpen(false)}
        title="Add New Hospital Inventory Item"
      >
        <form onSubmit={handleCreateItemSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Item ID (Positive Integer) *</label>
              <input
                type="number"
                required
                min="1"
                value={newItem.item_id}
                onChange={(e) => setNewItem({ ...newItem, item_id: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                placeholder="e.g. 1025"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category *</label>
              <select
                value={newItem.category}
                onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
              >
                <option value="Medicine">Medicine</option>
                <option value="Equipment">Equipment</option>
                <option value="Supplies">Supplies</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Item Name *</label>
            <input
              type="text"
              required
              minLength="2"
              value={newItem.item_name}
              onChange={(e) => setNewItem({ ...newItem, item_name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
              placeholder="e.g. Paracetamol 500mg IV"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Initial Quantity *</label>
              <input
                type="number"
                required
                min="0"
                value={newItem.quantity}
                onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Minimum Stock *</label>
              <input
                type="number"
                required
                min="0"
                value={newItem.minimum_stock}
                onChange={(e) => setNewItem({ ...newItem, minimum_stock: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Unit Price (₹) *</label>
              <input
                type="number"
                step="0.01"
                required
                min="0"
                value={newItem.unit_price}
                onChange={(e) => setNewItem({ ...newItem, unit_price: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Storage Location *</label>
              <input
                type="text"
                required
                value={newItem.location}
                onChange={(e) => setNewItem({ ...newItem, location: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                placeholder="e.g. Central Pharmacy Shelf C-4"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Supplier</label>
              <select
                value={newItem.supplier_id}
                onChange={(e) => setNewItem({ ...newItem, supplier_id: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
              >
                <option value="">Select Supplier (Optional)</option>
                {suppliersList.map((s) => (
                  <option key={s.supplier_id} value={s.supplier_id}>
                    {s.company_name} (#{s.supplier_id})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Expiry Date {newItem.category === 'Equipment' ? '(Optional for Equipment)' : '*'}
            </label>
            <input
              type="date"
              value={newItem.expiry_date}
              onChange={(e) => setNewItem({ ...newItem, expiry_date: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              rows="2"
              value={newItem.description}
              onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
              placeholder="Clinical usage notes or batch specifications"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setAddItemModalOpen(false)}
              className="px-4 py-2 text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-md shadow-teal-600/20"
            >
              Save to Database
            </button>
          </div>
        </form>
      </Modal>

      {/* QUICK ACTION: Receive Stock Modal */}
      <Modal
        isOpen={receiveStockModalOpen}
        onClose={() => setReceiveStockModalOpen(false)}
        title="Record Stock Received (STOCK_IN)"
      >
        <form onSubmit={handleReceiveStockSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Select Item *</label>
            <select
              required
              value={receiveForm.item_id}
              onChange={(e) => setReceiveForm({ ...receiveForm, item_id: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
            >
              <option value="">Select item to receive</option>
              {inventoryList.map((item) => (
                <option key={item.item_id} value={item.item_id}>
                  #{item.item_id} - {item.item_name} (Current: {item.quantity})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Quantity Received (Positive Integer) *</label>
            <input
              type="number"
              required
              min="1"
              value={receiveForm.quantity}
              onChange={(e) => setReceiveForm({ ...receiveForm, quantity: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Audit Reason / Purchase Reference *</label>
            <input
              type="text"
              required
              minLength="3"
              value={receiveForm.reason}
              onChange={(e) => setReceiveForm({ ...receiveForm, reason: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
              placeholder="e.g. Restock PO-9921 from Apex Medicare"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Logged By (Staff Name) *</label>
            <input
              type="text"
              required
              minLength="2"
              value={receiveForm.performed_by}
              onChange={(e) => setReceiveForm({ ...receiveForm, performed_by: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setReceiveStockModalOpen(false)}
              className="px-4 py-2 text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-md"
            >
              Confirm Stock Intake
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
