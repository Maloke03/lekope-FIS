import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, PAGE_ACCESS } from './contexts/AuthContext';

import Login from './components/auth/Login';
import Register from './components/auth/Register';

import ProtectedRoute from './components/auth/ProtectedRoute';
import RoleBasedRoute from './components/auth/RoleBasedRoute';
import Sidebar from './components/layout/Sidebar';
import Topbar from './components/layout/Topbar';

// Import all pages
import Dashboard from './pages/Dashboard';
import Revenue from './pages/Revenue';
import Expenses from './pages/Expenses';
import Invoices from './pages/Invoices';
import Budget from './pages/Budget';
import AdContracts from './pages/AdContracts';
import Advertisers from './pages/Advertisers';
import Bookings from './pages/Bookings';
import Payroll from './pages/Payroll';
import Tax from './pages/Tax';
import Assets from './pages/Assets';
import BankReconciliation from './pages/BankReconciliation';
import FinReports from './pages/FinReports';
import Analytics from './pages/Analytics';
import LandingPage from './pages/LandingPage';

const Layout = ({ children }) => {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <div style={{ marginLeft: 265, flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Topbar />
        <main style={{ flex: 1, padding: '24px 28px' }}>
          {children}
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* ===================== PUBLIC ROUTES ===================== */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* ===================== PROTECTED ROUTES ===================== */}

          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Layout>
                <RoleBasedRoute allowedRoles={PAGE_ACCESS['/dashboard']}>
                  <Dashboard />
                </RoleBasedRoute>
              </Layout>
            </ProtectedRoute>
          } />

          <Route path="/revenue" element={
            <ProtectedRoute>
              <Layout>
                <RoleBasedRoute allowedRoles={PAGE_ACCESS['/revenue']}>
                  <Revenue />
                </RoleBasedRoute>
              </Layout>
            </ProtectedRoute>
          } />

          <Route path="/expenses" element={
            <ProtectedRoute>
              <Layout>
                <RoleBasedRoute allowedRoles={PAGE_ACCESS['/expenses']}>
                  <Expenses />
                </RoleBasedRoute>
              </Layout>
            </ProtectedRoute>
          } />

          <Route path="/invoices" element={
            <ProtectedRoute>
              <Layout>
                <RoleBasedRoute allowedRoles={PAGE_ACCESS['/invoices']}>
                  <Invoices />
                </RoleBasedRoute>
              </Layout>
            </ProtectedRoute>
          } />

          <Route path="/budget" element={
            <ProtectedRoute>
              <Layout>
                <RoleBasedRoute allowedRoles={PAGE_ACCESS['/budget']}>
                  <Budget />
                </RoleBasedRoute>
              </Layout>
            </ProtectedRoute>
          } />

          <Route path="/adcontracts" element={
            <ProtectedRoute>
              <Layout>
                <RoleBasedRoute allowedRoles={PAGE_ACCESS['/adcontracts']}>
                  <AdContracts />
                </RoleBasedRoute>
              </Layout>
            </ProtectedRoute>
          } />

          <Route path="/advertisers" element={
            <ProtectedRoute>
              <Layout>
                <RoleBasedRoute allowedRoles={PAGE_ACCESS['/advertisers']}>
                  <Advertisers />
                </RoleBasedRoute>
              </Layout>
            </ProtectedRoute>
          } />

          <Route path="/bookings" element={
            <ProtectedRoute>
              <Layout>
                <RoleBasedRoute allowedRoles={PAGE_ACCESS['/bookings']}>
                  <Bookings />
                </RoleBasedRoute>
              </Layout>
            </ProtectedRoute>
          } />

          <Route path="/payroll" element={
            <ProtectedRoute>
              <Layout>
                <RoleBasedRoute allowedRoles={PAGE_ACCESS['/payroll']}>
                  <Payroll />
                </RoleBasedRoute>
              </Layout>
            </ProtectedRoute>
          } />

          <Route path="/bank-reconciliation" element={
            <ProtectedRoute>
              <Layout>
                <RoleBasedRoute allowedRoles={PAGE_ACCESS['/bank-reconciliation']}>
                  <BankReconciliation />
                </RoleBasedRoute>
              </Layout>
            </ProtectedRoute>
          } />

          <Route path="/tax" element={
            <ProtectedRoute>
              <Layout>
                <RoleBasedRoute allowedRoles={PAGE_ACCESS['/tax']}>
                  <Tax />
                </RoleBasedRoute>
              </Layout>
            </ProtectedRoute>
          } />

          <Route path="/assets" element={
            <ProtectedRoute>
              <Layout>
                <RoleBasedRoute allowedRoles={PAGE_ACCESS['/assets']}>
                  <Assets />
                </RoleBasedRoute>
              </Layout>
            </ProtectedRoute>
          } />

          <Route path="/reports" element={
            <ProtectedRoute>
              <Layout>
                <RoleBasedRoute allowedRoles={PAGE_ACCESS['/reports']}>
                  <FinReports />
                </RoleBasedRoute>
              </Layout>
            </ProtectedRoute>
          } />

          <Route path="/analytics" element={
            <ProtectedRoute>
              <Layout>
                <RoleBasedRoute allowedRoles={PAGE_ACCESS['/analytics']}>
                  <Analytics />
                </RoleBasedRoute>
              </Layout>
            </ProtectedRoute>
          } />

          <Route path="*" element={<LandingPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
