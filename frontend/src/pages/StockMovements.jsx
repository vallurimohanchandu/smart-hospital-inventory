import React, { useState, useEffect } from 'react';
import { 
  ArrowLeftRight, 
  ArrowDownLeft, 
  ArrowUpRight, 
  SlidersHorizontal, 
  Search, 
  Filter, 
  Calendar, 
  Clock, 
  RefreshCw,
  Plus
} from 'lucide-react';

import { MovementsAPI, InventoryAPI } from '../services/api';
import { formatDateTime } from '../utils/formatters';
import { MovementTypeBadge } from '../components/common/Badge';
import { LoadingSpinner, EmptyState, AlertBanner } from '../components/common/Feedback';
import Modal from '../components/common/Modal';

export default function StockMovements() {
  const [movements, setMovements] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  // Filters
  const [selectedType, setSelectedType] = useState('All');
  const [itemIdFilter, setItemIdFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modals & Inventory Lookup
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [inventoryList, setInventoryList] = useState([]);

  // Form State
  const [form, setForm] = useState({
    item_id: '',
    movement_type: 'STOCK_IN',
    quantity: 10,
    target_quantity: '',
    reason: '',
    performed_by: '',
  });

  const fetchMovements = async () => {
    try {
      setLoading(true);
      const res = await MovementsAPI.getAll({
        movement_type: selectedType !== 'All' ? selectedType : undefined,
        item_id: itemIdFilter ? parseInt(itemIdFilter) : undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        page,
        limit,
      });
      setMovements(res.movements || []);
      setTotal(res.total || 0);
    } catch (err) {
      setNotification({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const loadItems = async () => {
    try {
      const res = await InventoryAPI.getAll({ limit: 100 });
      setInventoryList(res.items || []);
    } catch {
      // Ignored
    }
  };

  useEffect(() => {
    fetchMovements();
  }, [page, limit, selectedType]);

  useEffect(() => {
    loadItems();
  }, []);

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchMovements();
  };

  const handleRecordSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        item_id: parseInt(form.item_id),
        movement_type: form.movement_type,
        quantity: parseInt(form.quantity),
        reason: form.reason.trim(),
        performed_by: form.performed_by.trim(),
      };
      if (form.movement_type === 'ADJUSTMENT' && form.target_quantity !== '') {
        payload.target_quantity = parseInt(form.target_quantity);
      }

      await MovementsAPI.record(payload);
      setNotification({
        type: 'success',
        message: `Successfully executed ${payload.movement_type} of ${payload.quantity} units for Item #${payload.item_id}!`,
      });
      setIsRecordModalOpen(false);
      setForm({
        item_id: '',
        movement_type: 'STOCK_IN',
        quantity: 10,
        target_quantity: '',
        reason: '',
        performed_by: '',
      });
      fetchMovements();
      loadItems();
    } catch (err) {
      setNotification({ type: 'error', message: err.message });
    }
  };

  const selectedItemData = inventoryList.find((i) => i.item_id === parseInt(form.item_id));

  return (
    <div className="space-y-6">
      {notification && (
        <AlertBanner
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      {/* Control Bar */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Stock Movement Audit Trail</h2>
            <p className="text-xs text-slate-500">Immutable ledger tracking hospital stock intake, dispatches, and corrections</p>
          </div>
          <button
            onClick={() => setIsRecordModalOpen(true)}
            className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-sm shadow-teal-600/20 transition-colors self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Record Movement
          </button>
        </div>

        {/* Filter Bar */}
        <form onSubmit={handleFilterSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2">
          {/* Movement Type Filter */}
          <div>
            <select
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none bg-white"
            >
              <option value="All">All Movement Types</option>
              <option value="STOCK_IN">STOCK_IN (Receipt)</option>
              <option value="STOCK_OUT">STOCK_OUT (Dispatched)</option>
              <option value="ADJUSTMENT">ADJUSTMENT (Audit)</option>
            </select>
          </div>

          {/* Item ID Filter */}
          <div>
            <input
              type="number"
              value={itemIdFilter}
              onChange={(e) => setItemIdFilter(e.target.value)}
              placeholder="Filter by Item ID..."
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>

          {/* Start Date */}
          <div>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
              title="Start Date"
            />
          </div>

          {/* End Date */}
          <div>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
              title="End Date"
            />
          </div>

          {/* Submit / Reset Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold"
            >
              Filter Logs
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedType('All');
                setItemIdFilter('');
                setStartDate('');
                setEndDate('');
                setPage(1);
                fetchMovements();
              }}
              className="p-2 border border-slate-300 hover:bg-slate-100 rounded-xl text-slate-600"
              title="Reset Filters"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>

      {/* Movements Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <LoadingSpinner text="Fetching audit movements..." />
        ) : movements.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="No movements recorded"
              description="No stock movements match your selected filters."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Tx ID</th>
                  <th className="py-3.5 px-4">Item Name & ID</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4 text-right">Qty Moved</th>
                  <th className="py-3.5 px-4 text-center">Stock Transition</th>
                  <th className="py-3.5 px-4">Audit Reason</th>
                  <th className="py-3.5 px-4">Operator</th>
                  <th className="py-3.5 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {movements.map((mov) => (
                  <tr key={mov.movement_id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-500 font-semibold">
                      #{mov.movement_id}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-900 block truncate max-w-xs">{mov.item_name}</span>
                      <span className="text-xs text-slate-400 font-mono">Item #{mov.item_id}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <MovementTypeBadge type={mov.movement_type} />
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                      {mov.quantity} units
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 rounded-lg text-xs font-mono">
                        <span className="text-slate-500">{mov.previous_quantity}</span>
                        <span className="text-slate-400">&rarr;</span>
                        <span className="font-bold text-teal-700">{mov.new_quantity}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600 max-w-xs truncate">
                      {mov.reason}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-medium text-slate-700">
                      {mov.performed_by}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-400">
                      {formatDateTime(mov.timestamp)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: Record Movement */}
      <Modal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        title="Execute Stock Movement Transaction"
      >
        <form onSubmit={handleRecordSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Select Item *</label>
            <select
              required
              value={form.item_id}
              onChange={(e) => setForm({ ...form, item_id: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
            >
              <option value="">Select target inventory item</option>
              {inventoryList.map((item) => (
                <option key={item.item_id} value={item.item_id}>
                  #{item.item_id} - {item.item_name} ({item.category} • In Stock: {item.quantity})
                </option>
              ))}
            </select>
          </div>

          {selectedItemData && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Available Quantity:</span>
                <span className="font-bold text-slate-900">{selectedItemData.quantity} units</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Expiry Status:</span>
                <span className={`font-semibold ${selectedItemData.expiry_status === 'Expired' ? 'text-rose-600' : 'text-slate-700'}`}>
                  {selectedItemData.expiry_status} ({selectedItemData.expiry_date || 'Non-Expiring'})
                </span>
              </div>
              {selectedItemData.category === 'Medicine' && selectedItemData.expiry_status === 'Expired' && (
                <p className="text-rose-600 font-bold pt-1">
                  ⚠️ WARNING: This medicine is expired. Outward stock dispatch (STOCK_OUT) will be rejected by policy!
                </p>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Movement Type *</label>
              <select
                value={form.movement_type}
                onChange={(e) => setForm({ ...form, movement_type: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
              >
                <option value="STOCK_IN">STOCK_IN (Receiving Restock)</option>
                <option value="STOCK_OUT">STOCK_OUT (Dispatched to Ward/OT)</option>
                <option value="ADJUSTMENT">ADJUSTMENT (Audit/Inventory Correction)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {form.movement_type === 'ADJUSTMENT' ? 'Adjustment Delta Units *' : 'Quantity *'}
              </label>
              <input
                type="number"
                required
                min="1"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
          </div>

          {form.movement_type === 'ADJUSTMENT' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Target Exact Stock Level (Optional override)
              </label>
              <input
                type="number"
                min="0"
                value={form.target_quantity}
                onChange={(e) => setForm({ ...form, target_quantity: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                placeholder="Directly set new inventory count"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Audit Reason / Department *</label>
            <input
              type="text"
              required
              minLength="3"
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
              placeholder="e.g. Dispensed to Intensive Care Unit Bay 3"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Authorized Staff Member *</label>
            <input
              type="text"
              required
              minLength="2"
              value={form.performed_by}
              onChange={(e) => setForm({ ...form, performed_by: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
              placeholder="e.g. Sister Meena (Senior Pharmacist)"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsRecordModalOpen(false)}
              className="px-4 py-2 text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-md"
            >
              Confirm & Post Movement
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
