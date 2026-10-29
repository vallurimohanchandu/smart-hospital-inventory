import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Eye, 
  Phone, 
  Mail, 
  MapPin, 
  Package, 
  BadgeIndianRupee,
  RefreshCw
} from 'lucide-react';

import { SuppliersAPI } from '../services/api';
import { formatCurrency } from '../utils/formatters';
import { LoadingSpinner, EmptyState, AlertBanner, ConfirmDialog } from '../components/common/Feedback';
import Modal from '../components/common/Modal';

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState(null);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [supplierDetails, setSupplierDetails] = useState(null);

  const initialForm = {
    supplier_id: '',
    company_name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    status: 'Active',
  };
  const [formData, setFormData] = useState(initialForm);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const res = await SuppliersAPI.getAll({
        search: searchTerm || undefined,
        page,
        limit,
      });
      setSuppliers(res.suppliers || []);
      setTotal(res.total || 0);
    } catch (err) {
      setNotification({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, [page, limit]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchSuppliers();
  };

  const openAddModal = () => {
    setFormData(initialForm);
    setIsAddModalOpen(true);
  };

  const openEditModal = (supplier) => {
    setSelectedSupplier(supplier);
    setFormData({
      supplier_id: supplier.supplier_id,
      company_name: supplier.company_name,
      contact_person: supplier.contact_person,
      email: supplier.email,
      phone: supplier.phone,
      address: supplier.address,
      status: supplier.status || 'Active',
    });
    setIsEditModalOpen(true);
  };

  const openDetailModal = async (supplier) => {
    try {
      const detailed = await SuppliersAPI.getById(supplier.supplier_id);
      setSupplierDetails(detailed);
      setIsDetailModalOpen(true);
    } catch (err) {
      setNotification({ type: 'error', message: err.message });
    }
  };

  const openDeleteDialog = (supplier) => {
    setSelectedSupplier(supplier);
    setIsDeleteDialogOpen(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        supplier_id: parseInt(formData.supplier_id),
      };
      await SuppliersAPI.create(payload);
      setNotification({ type: 'success', message: `Supplier #${payload.supplier_id} (${payload.company_name}) registered!` });
      setIsAddModalOpen(false);
      fetchSuppliers();
    } catch (err) {
      setNotification({ type: 'error', message: err.message });
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        company_name: formData.company_name,
        contact_person: formData.contact_person,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        status: formData.status,
      };
      await SuppliersAPI.update(selectedSupplier.supplier_id, payload);
      setNotification({ type: 'success', message: `Supplier #${selectedSupplier.supplier_id} profile updated!` });
      setIsEditModalOpen(false);
      fetchSuppliers();
    } catch (err) {
      setNotification({ type: 'error', message: err.message });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedSupplier) return;
    try {
      await SuppliersAPI.delete(selectedSupplier.supplier_id);
      setNotification({ type: 'success', message: `Supplier #${selectedSupplier.supplier_id} deleted.` });
      fetchSuppliers();
    } catch (err) {
      setNotification({ type: 'error', message: err.message });
    }
  };

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
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Hospital Medical Suppliers</h2>
          <p className="text-xs text-slate-500">Authorized pharmaceutical distributors & surgical supply partners</p>
        </div>
        <div className="flex items-center gap-3">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search company, contact..."
              className="pl-9 pr-4 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none w-56"
            />
          </form>
          <button
            onClick={openAddModal}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm shadow-teal-600/20"
          >
            <Plus className="w-4 h-4" />
            Add Supplier
          </button>
        </div>
      </div>

      {/* Suppliers Grid / Cards */}
      {loading ? (
        <LoadingSpinner text="Loading hospital suppliers directory..." />
      ) : suppliers.length === 0 ? (
        <EmptyState
          title="No suppliers found"
          description="No supplier records match your search query."
          action={
            <button
              onClick={() => {
                setSearchTerm('');
                fetchSuppliers();
              }}
              className="px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-semibold"
            >
              Reset Search
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {suppliers.map((s) => (
            <div
              key={s.supplier_id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <span className="text-[10px] font-mono text-teal-700 font-bold bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                      ID: #{s.supplier_id}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-1 line-clamp-1">
                      {s.company_name}
                    </h3>
                    <p className="text-xs text-slate-500">Contact: {s.contact_person}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    s.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {s.status}
                  </span>
                </div>

                <div className="space-y-2 text-xs text-slate-600 py-3 border-y border-slate-100 my-3">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span className="truncate">{s.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span>{s.phone}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{s.address}</span>
                  </div>
                </div>

                {/* Aggregated Inventory summary for this supplier */}
                <div className="grid grid-cols-2 gap-2 text-center bg-slate-50 p-2.5 rounded-xl border border-slate-100 mb-4">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Supplied Items</span>
                    <span className="text-xs font-bold text-slate-800">{s.item_count} items</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Stock Valuation</span>
                    <span className="text-xs font-bold text-teal-700">{formatCurrency(s.total_valuation)}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => openDetailModal(s)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" />
                  View Items
                </button>
                <button
                  onClick={() => openEditModal(s)}
                  className="p-1.5 text-slate-600 hover:text-sky-600 hover:bg-sky-50 rounded-lg"
                  title="Edit Supplier"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => openDeleteDialog(s)}
                  className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                  title="Delete Supplier"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL: Add Supplier */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Medical Supplier"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Supplier ID (Integer) *</label>
              <input
                type="number"
                required
                min="1"
                value={formData.supplier_id}
                onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                placeholder="e.g. 106"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Status *</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Company / Vendor Name *</label>
            <input
              type="text"
              required
              minLength="2"
              value={formData.company_name}
              onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
              placeholder="e.g. Bharat Diagnostics & Surgicals Ltd"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Person Name *</label>
            <input
              type="text"
              required
              minLength="2"
              value={formData.contact_person}
              onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
              placeholder="e.g. Rajiv Menon"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                placeholder="sales@vendor.com"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number *</label>
              <input
                type="text"
                required
                minLength="7"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                placeholder="+91-98765-43210"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Address *</label>
            <textarea
              rows="2"
              required
              minLength="3"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
              placeholder="Warehouse / Office postal address"
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
              Register Supplier
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Edit Supplier */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Edit Supplier #${selectedSupplier?.supplier_id}`}
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Company Name *</label>
            <input
              type="text"
              required
              minLength="2"
              value={formData.company_name}
              onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Person *</label>
              <input
                type="text"
                required
                minLength="2"
                value={formData.contact_person}
                onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone *</label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Address *</label>
            <textarea
              rows="2"
              required
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
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
              Save Changes
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Supplier Details & Associated Items */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={`Supplier Profile: ${supplierDetails?.company_name}`}
        maxWidth="max-w-3xl"
      >
        {supplierDetails && (
          <div className="space-y-5">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-mono text-teal-700 font-bold">ID: #{supplierDetails.supplier_id}</span>
                <h4 className="text-lg font-bold text-slate-900">{supplierDetails.company_name}</h4>
                <p className="text-xs text-slate-500">Contact: {supplierDetails.contact_person}</p>
                <p className="text-xs text-slate-500">{supplierDetails.email} • {supplierDetails.phone}</p>
              </div>
              <div className="sm:text-right">
                <span className="text-xs text-slate-500 block">Total Supplied Valuation</span>
                <span className="text-xl font-extrabold text-teal-700">{formatCurrency(supplierDetails.total_valuation)}</span>
                <span className="text-xs text-slate-400 block">{supplierDetails.item_count} catalog items</span>
              </div>
            </div>

            <div>
              <h5 className="text-sm font-bold text-slate-900 mb-2">Hospital Items Supplied by this Vendor</h5>
              {(!supplierDetails.items || supplierDetails.items.length === 0) ? (
                <p className="text-xs text-slate-500 py-4 text-center bg-slate-50 rounded-xl">
                  No inventory items are currently assigned to this supplier.
                </p>
              ) : (
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="p-2.5">Item ID</th>
                        <th className="p-2.5">Item Name</th>
                        <th className="p-2.5">Category</th>
                        <th className="p-2.5 text-right">Units</th>
                        <th className="p-2.5 text-right">Unit Price</th>
                        <th className="p-2.5 text-right">Total Line Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {supplierDetails.items.map((item) => (
                        <tr key={item.item_id} className="hover:bg-slate-50">
                          <td className="p-2.5 font-mono text-slate-500">#{item.item_id}</td>
                          <td className="p-2.5 font-semibold text-slate-900">{item.item_name}</td>
                          <td className="p-2.5">{item.category}</td>
                          <td className="p-2.5 text-right font-bold text-slate-900">{item.quantity}</td>
                          <td className="p-2.5 text-right">{formatCurrency(item.unit_price)}</td>
                          <td className="p-2.5 text-right font-semibold text-teal-700">
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
        )}
      </Modal>

      {/* CONFIRM: Delete Supplier */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Medical Supplier"
        message={`Are you sure you want to delete supplier #${selectedSupplier?.supplier_id} ("${selectedSupplier?.company_name}")? This will be rejected if inventory items are attached.`}
        confirmText="Yes, Delete Supplier"
      />
    </div>
  );
}
