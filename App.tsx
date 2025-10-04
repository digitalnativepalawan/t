

import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import DataManagement from './pages/DataManagement';
import Transactions from './pages/Transactions';
import Funds from './pages/Funds';
import Tasks from './pages/Tasks';
import Placeholder from './pages/Placeholder';
import Payroll from './pages/Payroll';
import Invoices from './pages/Invoices';
import Employees from './pages/Employees';
import Vendors from './pages/Vendors';
import Reports from './pages/Reports';

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Navigate to="/tasks" replace />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/home" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/data" element={<DataManagement />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/funds" element={<Funds />} />
          <Route path="/timesheets" element={<Placeholder title="Timesheets" />} />
          <Route path="/payroll" element={<Payroll />} />
          <Route path="/invoices" element={<Invoices />} />
          <Route path="/employees" element={<Employees />} />
          <Route path="/vendors" element={<Vendors />} />
          <Route path="/reports" element={<Reports />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}

export default App;