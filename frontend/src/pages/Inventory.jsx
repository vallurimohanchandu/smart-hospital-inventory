import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  ArrowUpDown, 
  Edit3, 
  Trash2, 
  Eye, 
  Package, 
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ExternalLink
} from 'lucide-react';

import { InventoryAPI, SuppliersAPI } from '../services/api';
import { formatCurrency, formatDate } from '../utils/formatters';
import { StockStatusBadge, ExpiryBadge, CategoryBadge } from '../components/common/Badge';
import { LoadingSpinner, EmptyState, AlertBanner, ConfirmDialog } from '../components/common/Feedback';
import Modal from '../components/common/Modal';

export default function Inventory() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  // Filters & Sorting
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStockStatus, setSelectedStockStatus] = useState('All');
  const [selectedExpiryStatus, setSelectedExpiryStatus] = useState('All');
  const [sortBy, setSortBy] = useState('item_id');
  const [sortOrder, setSortOrder] = useState('asc');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const [selectedItem, setSelectedItem] = useState(null);
  const [suppliers, setSuppliers] = useState([]);

  // Form State
  const initialFormState = {
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
  };
  const [formData, setFormData] = useState(initialFormState);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const res = await InventoryAPI.getAll({
        search: searchTerm || undefined,
        category: selectedCategory !== 'All' ? selectedCategory : undefined,
        stock_status: selectedStockStatus !== 'All' ? selectedStockStatus : undefined,
        expiry_status: selectedExpiryStatus !== 'All' ? selectedExpiryStatus : undefined,
        sort_by: sortBy,
        sort_order: sortOrder,
        page,
        limit,
      });
      setItems(res.items || []);
      setTotal(res.total || 0);
    } catch (err) {
      setNotification({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const res = await SuppliersAPI.getAll({ limit: 100 });
      setSuppliers(res.suppliers || []);
    } catch {
      // Ignored
    }
  };

  useEffect(() => {
    fetchItems();
  }, [page, limit, selectedCategory, selectedStockStatus, selectedExpiryStatus, sortBy, sortOrder]);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchItems();
  };

  const openAddModal = () => {
    setFormData(initialFormState);
    setIsAddModalOpen(true);
  };

  const openEditModal = (item) => {
    setSelectedItem(item);
    setFormData({
      item_id: item.item_id,
      item_name: item.item_name,
      category: item.category,
      quantity: item.quantity,
      minimum_stock: item.minimum_stock,
      unit_price: item.unit_price,
      location: item.location,
      supplier_id: item.supplier_id || '',
      expiry_date: item.expiry_date || '',
      description: item.description || '',
    });
    setIsEditModalOpen(true);
  };

  const openDetailModal = (item) => {
    setSelectedItem(item);
    setIsDetailModalOpen(true);
  };

  const openDeleteDialog = (item) => {
    setSelectedItem(item);
    setIsDeleteDialogOpen(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        item_id: parseInt(formData.item_id),
        quantity: parseInt(formData.quantity),
        minimum_stock: parseInt(formData.minimum_stock),
        unit_price: parseFloat(formData.unit_price),
        supplier_id: formData.supplier_id ? parseInt(formData.supplier_id) : null,
        expiry_date: formData.expiry_date ? formData.expiry_date : null,
      };
      await InventoryAPI.create(payload);
      setNotification({ type: 'success', message: `Item #${payload.item_id} added to inventory!` });
      setIsAddModalOpen(false);
      fetchItems();
    } catch (err) {
      setNotification({ type: 'error', message: err.message });
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        item_name: formData.item_name,
        category: formData.category,
        quantity: parseInt(formData.quantity),
        minimum_stock: parseInt(formData.minimum_stock),
        unit_price: parseFloat(formData.unit_price),
        location: formData.location,
        supplier_id: formData.supplier_id ? parseInt(formData.supplier_id) : null,
        expiry_date: formData.expiry_date ? formData.expiry_date : null,
        description: formData.description,
      };
      await InventoryAPI.update(selectedItem.item_id, payload);
      setNotification({ type: 'success', message: `Item #${selectedItem.item_id} details updated!` });
      setIsEditModalOpen(false);
      fetchItems();
    } catch (err) {
      setNotification({ type: 'error', message: err.message });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedItem) return;
    try {
      await InventoryAPI.delete(selectedItem.item_id);
      setNotification({ type: 'success', message: `Item #${selectedItem.item_id} deleted successfully.` });
      fetchItems();
    } catch (err) {
      setNotification({ type: 'error', message: err.message });
    }
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="space-y-6">
      {/* Alert Notifications */}
      {notification && (
        <AlertBanner
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      {/* Control Bar */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Hospital Inventory Catalog</h2>
            <p className="text-xs text-slate-500">Real-time stock tracking with MongoDB JSON Schema validation</p>
          </div>
          <button
            onClick={openAddModal}
            className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-sm shadow-teal-600/20 transition-colors self-start md:self-auto"
          >
            <Plus className="w-4 h-4" />
            Add New Item
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2">
          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} className="relative sm:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, ID, or location..."
              className="w-full pl-9 pr-20 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium"
            >
              Search
            </button>
          </form>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none bg-white"
            >
              <option value="All">All Categories</option>
              <option value="Medicine">Medicine</option>
              <option value="Equipment">Equipment</option>
              <option value="Supplies">Supplies</option>
            </select>
          </div>

          {/* Stock Status Filter */}
          <div>
            <select
              value={selectedStockStatus}
              onChange={(e) => {
                setSelectedStockStatus(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none bg-white"
            >
              <option value="All">All Stock Levels</option>
              <option value="In Stock">In Stock</option>
              <option value="Low Stock">Low Stock</option>
              <option value="Out of Stock">Out of Stock</option>
            </select>
          </div>

          {/* Expiry Status Filter */}
          <div>
            <select
              value={selectedExpiryStatus}
              onChange={(e) => {
                setSelectedExpiryStatus(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none bg-white"
            >
              <option value="All">All Expiry States</option>
              <option value="Expired">Expired</option>
              <option value="Expiring in 7 Days">≤ 7 Days</option>
              <option value="Expiring in 30 Days">≤ 30 Days</option>
              <option value="Expiring in 90 Days">≤ 90 Days</option>
              <option value="Non-Expiring">Non-Expiring</option>
            </select>
          </div>
        </div>
      </div>

      {/* Inventory Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <LoadingSpinner text="Fetching inventory records..." />
        ) : items.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="No items found"
              description="No inventory items match your current filter or search criteria."
              action={
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('All');
                    setSelectedStockStatus('All');
                    setSelectedExpiryStatus('All');
                    setPage(1);
                  }}
                  className="px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-semibold"
                >
                  Clear Filters
                </button>
              }
            />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-4 cursor-pointer" onClick={() => {
                      setSortBy('item_id');
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    }}>
                      <div className="flex items-center gap-1.5">
                        <span>ID</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>
                    <th className="py-3.5 px-4 cursor-pointer" onClick={() => {
                      setSortBy('item_name');
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    }}>
                      <div className="flex items-center gap-1.5">
                        <span>Item Name</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4 cursor-pointer text-right" onClick={() => {
                      setSortBy('quantity');
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    }}>
                      <div className="flex items-center justify-end gap-1.5">
                        <span>Stock (Min)</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>
                    <th className="py-3.5 px-4 cursor-pointer text-right" onClick={() => {
                      setSortBy('unit_price');
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    }}>
                      <div className="flex items-center justify-end gap-1.5">
                        <span>Unit Price</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Expiry Date</th>
                    <th className="py-3.5 px-4">Location</th>
                    <th className="py-3.5 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {items.map((item) => (
                    <tr key={item.item_id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-xs font-semibold text-slate-600">
                        #{item.item_id}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-900 block truncate max-w-xs">{item.item_name}</span>
                        {item.supplier_name && (
                          <span className="text-xs text-slate-400 block truncate max-w-xs">
                            {item.supplier_name}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <CategoryBadge category={item.category} />
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span className="font-bold text-slate-900">{item.quantity}</span>
                        <span className="text-xs text-slate-400"> / {item.minimum_stock}</span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-medium text-slate-800">
                        {formatCurrency(item.unit_price)}
                      </td>
                      <td className="py-3.5 px-4">
                        <StockStatusBadge status={item.stock_status} />
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <span className="text-xs text-slate-600 block">{formatDate(item.expiry_date)}</span>
                          <ExpiryBadge status={item.expiry_status} />
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600 max-w-xs truncate">
                        {item.location}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => openDetailModal(item)}
                            title="View Details"
                            className="p-1.5 text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(item)}
                            title="Edit Item"
                            className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openDeleteDialog(item)}
                            title="Delete Item"
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-600">
              <div>
                Showing <span className="font-semibold text-slate-900">{(page - 1) * limit + 1}</span> to{' '}
                <span className="font-semibold text-slate-900">{Math.min(page * limit, total)}</span> of{' '}
                <span className="font-semibold text-slate-900">{total}</span> inventory items
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="p-2 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-medium px-2">
                  Page {page} of {totalPages}
                </span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                  className="p-2 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* MODAL: Add Item */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Inventory Item"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Item ID (Positive Integer) *</label>
              <input
                type="number"
                required
                min="1"
                value={formData.item_id}
                onChange={(e) => setFormData({ ...formData, item_id: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                placeholder="e.g. 1025"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
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
              value={formData.item_name}
              onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
              placeholder="e.g. Ceftriaxone 1g Injectable"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Quantity *</label>
              <input
                type="number"
                required
                min="0"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Minimum Stock *</label>
              <input
                type="number"
                required
                min="0"
                value={formData.minimum_stock}
                onChange={(e) => setFormData({ ...formData, minimum_stock: e.target.value })}
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
                value={formData.unit_price}
                onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
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
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                placeholder="e.g. ICU Bay 2 Shelf A"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Supplier</label>
              <select
                value={formData.supplier_id}
                onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
              >
                <option value="">Select Supplier (Optional)</option>
                {suppliers.map((s) => (
                  <option key={s.supplier_id} value={s.supplier_id}>
                    {s.company_name} (#{s.supplier_id})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Expiry Date {formData.category === 'Equipment' ? '(Optional for Equipment)' : '*'}
            </label>
            <input
              type="date"
              value={formData.expiry_date}
              onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              rows="2"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
              placeholder="Clinical specifications, dosage notes..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-md"
            >
              Add to Catalog
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Edit Item */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Edit Inventory Item #${selectedItem?.item_id}`}
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Item Name *</label>
            <input
              type="text"
              required
              minLength="2"
              value={formData.item_name}
              onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
              >
                <option value="Medicine">Medicine</option>
                <option value="Equipment">Equipment</option>
                <option value="Supplies">Supplies</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Quantity *</label>
              <input
                type="number"
                required
                min="0"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Minimum Stock *</label>
              <input
                type="number"
                required
                min="0"
                value={formData.minimum_stock}
                onChange={(e) => setFormData({ ...formData, minimum_stock: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Unit Price (₹) *</label>
              <input
                type="number"
                step="0.01"
                required
                min="0"
                value={formData.unit_price}
                onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Storage Location *</label>
              <input
                type="text"
                required
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Supplier</label>
              <select
                value={formData.supplier_id}
                onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
              >
                <option value="">No Supplier Assigned</option>
                {suppliers.map((s) => (
                  <option key={s.supplier_id} value={s.supplier_id}>
                    {s.company_name} (#{s.supplier_id})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Expiry Date</label>
              <input
                type="date"
                value={formData.expiry_date}
                onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              rows="2"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-md"
            >
              Update Item
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Item Details */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="Inventory Item Details & Audit"
      >
        {selectedItem && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 font-mono">Item ID: #{selectedItem.item_id}</span>
                <h4 className="text-lg font-bold text-slate-900">{selectedItem.item_name}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <CategoryBadge category={selectedItem.category} />
                  <StockStatusBadge status={selectedItem.stock_status} />
                  <ExpiryBadge status={selectedItem.expiry_status} />
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-500 block">Unit Price</span>
                <span className="text-lg font-bold text-teal-700">{formatCurrency(selectedItem.unit_price)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-white border border-slate-200 rounded-xl">
                <span className="text-slate-500 block mb-1">Current Stock Quantity</span>
                <span className="text-base font-bold text-slate-900">{selectedItem.quantity} units</span>
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-xl">
                <span className="text-slate-500 block mb-1">Minimum Reorder Level</span>
                <span className="text-base font-bold text-slate-900">{selectedItem.minimum_stock} units</span>
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-xl">
                <span className="text-slate-500 block mb-1">Storage Location</span>
                <span className="text-sm font-semibold text-slate-800">{selectedItem.location}</span>
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-xl">
                <span className="text-slate-500 block mb-1">Supplier Name</span>
                <span className="text-sm font-semibold text-slate-800">{selectedItem.supplier_name || 'Not assigned'}</span>
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-xl">
                <span className="text-slate-500 block mb-1">Expiry Date</span>
                <span className="text-sm font-semibold text-slate-800">{formatDate(selectedItem.expiry_date)}</span>
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-xl">
                <span className="text-slate-500 block mb-1">Total Line Value</span>
                <span className="text-sm font-bold text-teal-700">
                  {formatCurrency(selectedItem.quantity * selectedItem.unit_price)}
                </span>
              </div>
            </div>

            {selectedItem.description && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700">
                <span className="font-semibold block text-slate-900 mb-1">Item Description / Usage Notes:</span>
                {selectedItem.description}
              </div>
            )}

            <div className="pt-2 text-[11px] text-slate-400 flex justify-between border-t border-slate-100">
              <span>Created: {formatDate(selectedItem.created_at)}</span>
              <span>Updated: {formatDate(selectedItem.updated_at)}</span>
            </div>
          </div>
        )}
      </Modal>

      {/* CONFIRM: Delete Item */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Inventory Item"
        message={`Are you sure you want to delete item #${selectedItem?.item_id} ("${selectedItem?.item_name}")? This action cannot be undone.`}
        confirmText="Yes, Delete Item"
      />
    </div>
  );
}
