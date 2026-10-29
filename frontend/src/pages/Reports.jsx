import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Layers, 
  DollarSign, 
  AlertTriangle, 
  Clock, 
  Truck, 
  Gem, 
  ArrowLeftRight, 
  LineChart as LineChartIcon,
  Code2,
  RefreshCw
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  LineChart, 
  Line,
  CartesianGrid
} from 'recharts';

import { ReportsAPI } from '../services/api';
import { formatCurrency } from '../utils/formatters';
import { LoadingSpinner, AlertBanner } from '../components/common/Feedback';
import { MovementTypeBadge, CategoryBadge } from '../components/common/Badge';

function AggregationExplainer({ stages, explanation }) {
  const [showJson, setShowJson] = useState(false);

  return (
    <div className="bg-slate-900 text-slate-200 p-4 rounded-xl text-xs space-y-2 mt-4 font-mono border border-slate-800">
      <div className="flex items-center justify-between text-teal-400 font-sans font-bold">
        <div className="flex items-center gap-1.5">
          <Code2 className="w-4 h-4" />
          <span>MongoDB Aggregation Pipeline Architecture</span>
        </div>
        <button
          onClick={() => setShowJson(!showJson)}
          className="text-[11px] text-teal-300 hover:text-teal-100 underline"
        >
          {showJson ? 'Hide Stage JSON' : 'View Pipeline JSON'}
        </button>
      </div>
      <p className="font-sans text-slate-300 leading-relaxed text-[11px]">{explanation}</p>
      {showJson && (
        <pre className="p-3 bg-slate-950 rounded-lg overflow-x-auto text-[11px] text-teal-300 border border-slate-800">
          {JSON.stringify(stages, null, 2)}
        </pre>
      )}
    </div>
  );
}

export default function Reports() {
  const [activeReport, setActiveReport] = useState('category');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchReport = async (reportKey) => {
    try {
      setLoading(true);
      setError(null);
      let res;
      switch (reportKey) {
        case 'category':
          res = await ReportsAPI.getCategorySummary();
          break;
        case 'valuation':
          res = await ReportsAPI.getInventoryValue();
          break;
        case 'low-stock':
          res = await ReportsAPI.getLowStock();
          break;
        case 'expired':
          res = await ReportsAPI.getExpired();
          break;
        case 'supplier':
          res = await ReportsAPI.getSupplierSummary();
          break;
        case 'expensive':
          res = await ReportsAPI.getTopExpensive();
          break;
        case 'movements':
          res = await ReportsAPI.getMovementSummary();
          break;
        case 'trends':
          res = await ReportsAPI.getMonthlyTrends();
          break;
        default:
          res = await ReportsAPI.getCategorySummary();
      }
      setData(res);
    } catch (err) {
      setError(err.message || 'Failed to execute aggregation query');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport(activeReport);
  }, [activeReport]);

  const reportTabs = [
    { id: 'category', label: '1. Category Summary', icon: Layers },
    { id: 'valuation', label: '2. Total Valuation', icon: DollarSign },
    { id: 'low-stock', label: '3. Low-Stock Report', icon: AlertTriangle },
    { id: 'expired', label: '4. Expired Items', icon: Clock },
    { id: 'supplier', label: '5. Supplier Summary', icon: Truck },
    { id: 'expensive', label: '6. Top 5 Expensive Assets', icon: Gem },
    { id: 'movements', label: '7. Movement Summary', icon: ArrowLeftRight },
    { id: 'trends', label: '8. Monthly Stock Trends', icon: LineChartIcon },
  ];

  return (
    <div className="space-y-6">
      {error && <AlertBanner type="error" message={error} />}

      {/* Header Bar */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Intelligent NoSQL Reports & Analytics</h2>
          <p className="text-xs text-slate-500">
            All reports are computed dynamically using multi-stage MongoDB aggregation pipelines in PyMongo
          </p>
        </div>
        <button
          onClick={() => fetchReport(activeReport)}
          className="p-2.5 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors border border-slate-200 flex items-center gap-1.5 text-xs font-semibold self-start sm:self-auto"
        >
          <RefreshCw className="w-4 h-4" />
          Re-run Pipeline
        </button>
      </div>

      {/* Report Navigation Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
        {reportTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeReport === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveReport(tab.id)}
              className={`p-3 rounded-xl border text-left text-xs font-semibold transition-all flex flex-col justify-between gap-2 ${
                isActive
                  ? 'bg-teal-600 text-white border-teal-600 shadow-md shadow-teal-600/20'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-teal-600'}`} />
              <span className="line-clamp-2">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Report Container */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
        {loading ? (
          <LoadingSpinner text="Executing MongoDB aggregation pipeline on server..." />
        ) : !data ? (
          <p className="text-sm text-slate-500 py-8 text-center">No report data returned.</p>
        ) : (
          <>
            <div>
              <span className="text-xs font-mono font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-md border border-teal-200">
                Course Aggregation Output
              </span>
              <h3 className="text-lg font-bold text-slate-900 mt-2">{data.title}</h3>
            </div>

            {/* REPORT 1: Category Summary */}
            {activeReport === 'category' && (
              <div className="space-y-6">
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.data}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="category" />
                      <YAxis tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', border: 'none' }}
                        formatter={(val, name) => [
                          name === 'total_valuation' ? formatCurrency(val) : val,
                          name === 'total_valuation' ? 'Valuation' : 'Units'
                        ]}
                      />
                      <Legend />
                      <Bar dataKey="total_valuation" fill="#0d9488" name="Total Valuation (₹)" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="total_quantity" fill="#0284c7" name="Total Stock Units" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 font-bold text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="p-3">Category</th>
                        <th className="p-3 text-right">Unique Items</th>
                        <th className="p-3 text-right">Total Units</th>
                        <th className="p-3 text-right">Category Valuation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data.data.map((row) => (
                        <tr key={row.category} className="hover:bg-slate-50">
                          <td className="p-3 font-semibold text-slate-900">{row.category}</td>
                          <td className="p-3 text-right font-medium text-slate-700">{row.item_count} documents</td>
                          <td className="p-3 text-right font-bold text-slate-900">{row.total_quantity}</td>
                          <td className="p-3 text-right font-bold text-teal-700">{formatCurrency(row.total_valuation)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* REPORT 2: Total Inventory Valuation */}
            {activeReport === 'valuation' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="p-5 bg-teal-50/60 border border-teal-200 rounded-xl">
                    <span className="text-xs text-teal-700 font-semibold block">Total Inventory Valuation</span>
                    <span className="text-2xl font-black text-teal-900 mt-1 block">
                      {formatCurrency(data.data.total_valuation)}
                    </span>
                    <span className="text-[11px] text-teal-600">Sum across all catalog items</span>
                  </div>
                  <div className="p-5 bg-sky-50/60 border border-sky-200 rounded-xl">
                    <span className="text-xs text-sky-700 font-semibold block">Total Units Stocked</span>
                    <span className="text-2xl font-black text-sky-900 mt-1 block">
                      {data.data.total_units} units
                    </span>
                    <span className="text-[11px] text-sky-600">Total units physically available</span>
                  </div>
                  <div className="p-5 bg-indigo-50/60 border border-indigo-200 rounded-xl">
                    <span className="text-xs text-indigo-700 font-semibold block">Unique Catalog Items</span>
                    <span className="text-2xl font-black text-indigo-900 mt-1 block">
                      {data.data.total_unique_items} SKUs
                    </span>
                    <span className="text-[11px] text-indigo-600">Total distinct document records</span>
                  </div>
                  <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="text-xs text-slate-600 font-semibold block">Average Unit Price</span>
                    <span className="text-2xl font-black text-slate-900 mt-1 block">
                      {formatCurrency(data.data.average_unit_price)}
                    </span>
                    <span className="text-[11px] text-slate-500">Global mean price ($avg stage)</span>
                  </div>
                </div>
              </div>
            )}

            {/* REPORT 3: Low-Stock Items */}
            {activeReport === 'low-stock' && (
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 font-bold text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="p-3">Item ID</th>
                      <th className="p-3">Item Name</th>
                      <th className="p-3">Category</th>
                      <th className="p-3 text-right">Available</th>
                      <th className="p-3 text-right">Threshold</th>
                      <th className="p-3 text-right">Shortage</th>
                      <th className="p-3">Urgency Status</th>
                      <th className="p-3">Location</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.data.map((item) => (
                      <tr key={item.item_id} className="hover:bg-slate-50">
                        <td className="p-3 font-mono text-slate-500">#{item.item_id}</td>
                        <td className="p-3 font-semibold text-slate-900">{item.item_name}</td>
                        <td className="p-3"><CategoryBadge category={item.category} /></td>
                        <td className="p-3 text-right font-bold text-slate-900">{item.quantity}</td>
                        <td className="p-3 text-right text-slate-600">{item.minimum_stock}</td>
                        <td className="p-3 text-right font-bold text-rose-600">-{item.shortage}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            item.urgency === 'OUT_OF_STOCK' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {item.urgency}
                          </span>
                        </td>
                        <td className="p-3 text-slate-600">{item.location}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* REPORT 4: Expired Items */}
            {activeReport === 'expired' && (
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 font-bold text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="p-3">Item ID</th>
                      <th className="p-3">Item Name</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">Expiry Date</th>
                      <th className="p-3 text-right">Expired Units</th>
                      <th className="p-3 text-right">Unit Price</th>
                      <th className="p-3 text-right">Financial Loss</th>
                      <th className="p-3">Location</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.data.map((item) => (
                      <tr key={item.item_id} className="hover:bg-rose-50/30">
                        <td className="p-3 font-mono text-slate-500">#{item.item_id}</td>
                        <td className="p-3 font-semibold text-rose-900">{item.item_name}</td>
                        <td className="p-3"><CategoryBadge category={item.category} /></td>
                        <td className="p-3 font-bold text-rose-600">{item.expiry_date}</td>
                        <td className="p-3 text-right font-bold text-slate-900">{item.quantity}</td>
                        <td className="p-3 text-right text-slate-600">{formatCurrency(item.unit_price)}</td>
                        <td className="p-3 text-right font-bold text-rose-700">{formatCurrency(item.loss_valuation)}</td>
                        <td className="p-3 text-slate-600">{item.location}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* REPORT 5: Supplier Summary */}
            {activeReport === 'supplier' && (
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 font-bold text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="p-3">Supplier ID</th>
                      <th className="p-3">Supplier Name</th>
                      <th className="p-3 text-right">Catalog SKUs</th>
                      <th className="p-3 text-right">Total Units Supplied</th>
                      <th className="p-3 text-right">Total Inventory Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.data.map((s) => (
                      <tr key={s.supplier_id} className="hover:bg-slate-50">
                        <td className="p-3 font-mono text-slate-500">#{s.supplier_id}</td>
                        <td className="p-3 font-semibold text-slate-900">{s.supplier_name}</td>
                        <td className="p-3 text-right font-medium text-slate-700">{s.total_items} items</td>
                        <td className="p-3 text-right font-bold text-slate-900">{s.total_units} units</td>
                        <td className="p-3 text-right font-bold text-teal-700">{formatCurrency(s.total_valuation)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* REPORT 6: Top 5 Expensive Assets */}
            {activeReport === 'expensive' && (
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 font-bold text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="p-3">Rank</th>
                      <th className="p-3">Item ID</th>
                      <th className="p-3">Item Name</th>
                      <th className="p-3">Category</th>
                      <th className="p-3 text-right">Unit Price</th>
                      <th className="p-3 text-right">Quantity</th>
                      <th className="p-3 text-right">Total Asset Value</th>
                      <th className="p-3">Location</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.data.map((item, idx) => (
                      <tr key={item.item_id} className="hover:bg-slate-50">
                        <td className="p-3 font-bold text-teal-700">#{idx + 1}</td>
                        <td className="p-3 font-mono text-slate-500">#{item.item_id}</td>
                        <td className="p-3 font-semibold text-slate-900">{item.item_name}</td>
                        <td className="p-3"><CategoryBadge category={item.category} /></td>
                        <td className="p-3 text-right font-bold text-slate-900">{formatCurrency(item.unit_price)}</td>
                        <td className="p-3 text-right font-medium text-slate-700">{item.quantity}</td>
                        <td className="p-3 text-right font-black text-teal-700">{formatCurrency(item.total_value)}</td>
                        <td className="p-3 text-slate-600">{item.location}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* REPORT 7: Stock Movement Summary */}
            {activeReport === 'movements' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {data.data.map((m) => (
                    <div key={m.movement_type} className="p-5 bg-slate-50 border border-slate-200 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <MovementTypeBadge type={m.movement_type} />
                        <span className="text-xs font-bold text-slate-500">{m.total_events} transactions</span>
                      </div>
                      <span className="text-2xl font-black text-slate-900 block mt-2">{m.total_units_moved} units</span>
                      <span className="text-xs text-slate-500">Cumulative quantity moved</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* REPORT 8: Monthly Stock Trends */}
            {activeReport === 'trends' && (
              <div className="space-y-6">
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.data}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', border: 'none' }} />
                      <Legend />
                      <Line type="monotone" dataKey="stock_in" stroke="#0d9488" strokeWidth={3} name="STOCK_IN Units" />
                      <Line type="monotone" dataKey="stock_out" stroke="#e11d48" strokeWidth={3} name="STOCK_OUT Units" />
                      <Line type="monotone" dataKey="adjustment" stroke="#f59e0b" strokeWidth={2} name="ADJUSTMENT Units" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Aggregation Pipeline Explainer Card */}
            <AggregationExplainer
              stages={data.pipeline_stages}
              explanation={data.explanation}
            />
          </>
        )}
      </div>
    </div>
  );
}
