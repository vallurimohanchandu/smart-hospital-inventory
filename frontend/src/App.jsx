import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import StockMovements from './pages/StockMovements';
import Suppliers from './pages/Suppliers';
import ExpiryManagement from './pages/ExpiryManagement';
import Reports from './pages/Reports';
import ProjectInfo from './pages/ProjectInfo';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="movements" element={<StockMovements />} />
          <Route path="suppliers" element={<Suppliers />} />
          <Route path="expiry" element={<ExpiryManagement />} />
          <Route path="reports" element={<Reports />} />
          <Route path="project-info" element={<ProjectInfo />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
