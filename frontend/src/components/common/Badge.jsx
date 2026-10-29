import React from 'react';

export function StockStatusBadge({ status }) {
  if (status === 'Out of Stock') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
        <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-rose-600 animate-ping"></span>
        Out of Stock
      </span>
    );
  }
  if (status === 'Low Stock') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
        <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-amber-500"></span>
        Low Stock
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
      <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-emerald-500"></span>
      In Stock
    </span>
  );
}

export function ExpiryBadge({ status }) {
  if (status === 'Expired') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
        Expired
      </span>
    );
  }
  if (status === 'Expiring in 7 Days') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200 animate-pulse">
        ≤ 7 Days Left
      </span>
    );
  }
  if (status === 'Expiring in 30 Days') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
        ≤ 30 Days Left
      </span>
    );
  }
  if (status === 'Expiring in 90 Days') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
        ≤ 90 Days Left
      </span>
    );
  }
  if (status === 'Non-Expiring') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
        Equipment (Non-Exp)
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
      Valid
    </span>
  );
}

export function CategoryBadge({ category }) {
  const styles = {
    Medicine: 'bg-teal-50 text-teal-700 border-teal-200',
    Supplies: 'bg-sky-50 text-sky-700 border-sky-200',
    Equipment: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium border ${styles[category] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
      {category}
    </span>
  );
}

export function MovementTypeBadge({ type }) {
  if (type === 'STOCK_IN') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
        + STOCK IN
      </span>
    );
  }
  if (type === 'STOCK_OUT') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
        - STOCK OUT
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
      ~ ADJUSTMENT
    </span>
  );
}
