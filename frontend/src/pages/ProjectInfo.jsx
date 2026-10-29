import React from 'react';
import { 
  Database, 
  Layers, 
  ShieldCheck, 
  CheckCircle2, 
  FileText, 
  Server, 
  Cpu, 
  Terminal, 
  Info,
  GitBranch
} from 'lucide-react';

export default function ProjectInfo() {
  return (
    <div className="space-y-8 max-w-5xl">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-navy-900 via-slate-900 to-teal-950 text-white p-8 rounded-3xl shadow-xl border border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
            Course Project: CSE494
          </span>
          <span className="text-xs text-slate-400">Intelligent NoSQL Databases</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          Smart Hospital Inventory Management System
        </h1>
        <p className="text-sm text-slate-300 mt-2 max-w-2xl leading-relaxed">
          A production-grade, document-oriented hospital administration web application built with MongoDB JSON Schema validation, PyMongo, FastAPI, and React.
        </p>
      </div>

      {/* Tech Stack Matrix */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Server className="w-5 h-5 text-teal-600" />
          Technical Architecture & Stack
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <span className="text-xs font-bold text-teal-700 uppercase tracking-wider block">Database Tier</span>
            <h4 className="font-bold text-slate-900">MongoDB 8.x</h4>
            <ul className="text-xs text-slate-600 space-y-1">
              <li>• Database: <code className="font-mono text-teal-700 font-semibold">SmartHospitalDB</code></li>
              <li>• JSON Schema Validators ($jsonSchema)</li>
              <li>• Unique B-Tree Indexes on Natural Keys</li>
              <li>• 8 Native Aggregation Pipelines</li>
            </ul>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <span className="text-xs font-bold text-sky-700 uppercase tracking-wider block">Backend API</span>
            <h4 className="font-bold text-slate-900">Python 3.11 & FastAPI</h4>
            <ul className="text-xs text-slate-600 space-y-1">
              <li>• PyMongo Native Driver (No ORM/ODM)</li>
              <li>• Pydantic v2 Input & Response Models</li>
              <li>• Safe ObjectId String Sanitization</li>
              <li>• Pytest Automated Test Suite (100% Pass)</li>
            </ul>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider block">Client Tier</span>
            <h4 className="font-bold text-slate-900">React 18 & Vite</h4>
            <ul className="text-xs text-slate-600 space-y-1">
              <li>• Tailwind CSS Hospital Design System</li>
              <li>• Recharts Analytics & Data Visualization</li>
              <li>• React Router v6 Multi-page Routing</li>
              <li>• Axios Centralized HTTP Interceptors</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Database Schema & Validation Rules */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Database className="w-5 h-5 text-teal-600" />
          Collections & MongoDB JSON Schema Validation
        </h3>

        <div className="space-y-4">
          <div className="border border-slate-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-slate-900 font-mono text-sm">1. collection: "inventory"</span>
              <span className="text-xs font-semibold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded">
                Unique Index: item_id
              </span>
            </div>
            <p className="text-xs text-slate-600 mb-3">
              Stores hospital pharmaceuticals, surgical supplies, and biomedical equipment.
            </p>
            <div className="bg-slate-900 text-teal-300 p-3 rounded-lg font-mono text-[11px] overflow-x-auto">
              {`required: ["item_id", "item_name", "category", "quantity", "minimum_stock", "unit_price", "location"]
category enum: ["Medicine", "Equipment", "Supplies"]
rules: quantity >= 0, minimum_stock >= 0, unit_price >= 0, item_id >= 1`}
            </div>
          </div>

          <div className="border border-slate-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-slate-900 font-mono text-sm">2. collection: "suppliers"</span>
              <span className="text-xs font-semibold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded">
                Unique Index: supplier_id
              </span>
            </div>
            <p className="text-xs text-slate-600 mb-3">
              Maintains verified medical supply distributors, contract contacts, and postal addresses.
            </p>
            <div className="bg-slate-900 text-teal-300 p-3 rounded-lg font-mono text-[11px] overflow-x-auto">
              {`required: ["supplier_id", "company_name", "contact_person", "email", "phone", "address"]
email pattern: "^.+@.+$"
status enum: ["Active", "Inactive"]`}
            </div>
          </div>

          <div className="border border-slate-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-slate-900 font-mono text-sm">3. collection: "stock_movements"</span>
              <span className="text-xs font-semibold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded">
                Unique Index: movement_id
              </span>
            </div>
            <p className="text-xs text-slate-600 mb-3">
              Immutable audit ledger capturing all stock receipts, dispatches to wards, and audit adjustments.
            </p>
            <div className="bg-slate-900 text-teal-300 p-3 rounded-lg font-mono text-[11px] overflow-x-auto">
              {`required: ["movement_id", "item_id", "item_name", "movement_type", "quantity", "previous_quantity", "new_quantity", "reason", "performed_by", "timestamp"]
movement_type enum: ["STOCK_IN", "STOCK_OUT", "ADJUSTMENT"]`}
            </div>
          </div>
        </div>
      </div>

      {/* Index Optimization Table */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-teal-600" />
          MongoDB Indexes Implemented
        </h3>
        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 font-bold text-slate-600 border-b border-slate-200">
              <tr>
                <th className="p-3">Collection</th>
                <th className="p-3">Index Keys</th>
                <th className="p-3">Properties</th>
                <th className="p-3">Optimization Purpose</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr className="hover:bg-slate-50">
                <td className="p-3 font-mono font-bold text-slate-900">inventory</td>
                <td className="p-3 font-mono text-teal-700">{`{ item_id: 1 }`}</td>
                <td className="p-3"><span className="text-emerald-700 font-bold">unique: true</span></td>
                <td className="p-3">O(1) natural key point lookups & duplicate item rejection</td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="p-3 font-mono font-bold text-slate-900">inventory</td>
                <td className="p-3 font-mono text-teal-700">{`{ category: 1 }`}</td>
                <td className="p-3">standard</td>
                <td className="p-3">Accelerates category-wise filtering and $group aggregation</td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="p-3 font-mono font-bold text-slate-900">inventory</td>
                <td className="p-3 font-mono text-teal-700">{`{ quantity: 1 }`}</td>
                <td className="p-3">standard</td>
                <td className="p-3">Fast index scans for out-of-stock and low-stock evaluations</td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="p-3 font-mono font-bold text-slate-900">inventory</td>
                <td className="p-3 font-mono text-teal-700">{`{ expiry_date: 1 }`}</td>
                <td className="p-3">standard</td>
                <td className="p-3">Enables range queries for expired and near-expiry medication</td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="p-3 font-mono font-bold text-slate-900">inventory</td>
                <td className="p-3 font-mono text-teal-700">{`{ supplier_id: 1 }`}</td>
                <td className="p-3">standard</td>
                <td className="p-3">Optimizes supplier-wise inventory lookups and joins</td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="p-3 font-mono font-bold text-slate-900">suppliers</td>
                <td className="p-3 font-mono text-teal-700">{`{ supplier_id: 1 }`}</td>
                <td className="p-3"><span className="text-emerald-700 font-bold">unique: true</span></td>
                <td className="p-3">Ensures uniqueness of supplier credentials and fast profile retrieval</td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="p-3 font-mono font-bold text-slate-900">stock_movements</td>
                <td className="p-3 font-mono text-teal-700">{`{ movement_id: 1 }`}</td>
                <td className="p-3"><span className="text-emerald-700 font-bold">unique: true</span></td>
                <td className="p-3">Guarantees unique audit sequence IDs</td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="p-3 font-mono font-bold text-slate-900">stock_movements</td>
                <td className="p-3 font-mono text-teal-700">{`{ item_id: 1 }, { timestamp: 1 }`}</td>
                <td className="p-3">standard</td>
                <td className="p-3">Chronological audit ledger sorting and item-specific audit filtering</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Execution Commands */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Terminal className="w-5 h-5 text-teal-600" />
          Terminal Execution Commands
        </h3>
        <div className="bg-slate-900 text-teal-300 p-4 rounded-xl font-mono text-xs space-y-3">
          <div>
            <span className="text-slate-400 block mb-1"># 1. Initialize MongoDB Schema & Indexes</span>
            <code>python backend/scripts/setup_database.py</code>
          </div>
          <div>
            <span className="text-slate-400 block mb-1"># 2. Seed Fictional Demonstration Dataset</span>
            <code>python backend/scripts/seed_data.py</code>
          </div>
          <div>
            <span className="text-slate-400 block mb-1"># 3. Run Automated Pytest Suite (Isolated Test DB)</span>
            <code>python backend/run_tests.py</code>
          </div>
          <div>
            <span className="text-slate-400 block mb-1"># 4. Start FastAPI Backend</span>
            <code>python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 (in backend/)</code>
          </div>
          <div>
            <span className="text-slate-400 block mb-1"># 5. Start React Vite Frontend</span>
            <code>npm run dev (in frontend/)</code>
          </div>
        </div>
      </div>
    </div>
  );
}
