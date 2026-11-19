import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import useAuth from './hooks/useAuth';
import ProtectedRoute from './components/common/ProtectedRoute';
import AdminLayout from './components/layout/AdminLayout';
import OperatorLayout from './components/layout/OperatorLayout';

import Login from './pages/Login';
import SetupAdmin from './pages/SetupAdmin';
import Dashboard from './pages/Dashboard';
import Matieres from './pages/Matieres';
import Lots from './pages/Lots';
import Mouvements from './pages/Mouvements';
import Produits from './pages/Produits';
import Compositions from './pages/Compositions';
import Ordres from './pages/Ordres';
import OrdreCreate from './pages/OrdreCreate';
import OrdreDetail from './pages/OrdreDetail';
import OperatorDashboard from './pages/OperatorDashboard';
import NotFound from './pages/NotFound';

function RootRedirect() {
  const { isAuthenticated, role, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="center-page" style={{ minHeight: '100vh' }}>
        <div className="empty-state">
          <span className="spinner" style={{ width: 32, height: 32 }}></span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return role === 'ADMIN' ? <Navigate to="/dashboard" replace /> : <Navigate to="/operator" replace />;
}

export default function App() {
  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/setup-admin" element={<SetupAdmin />} />

      {/* Root redirect */}
      <Route path="/" element={<RootRedirect />} />

      {/* Admin Module Routes (ADMIN only) */}
      <Route
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/matieres" element={<Matieres />} />
        <Route path="/lots" element={<Lots />} />
        <Route path="/mouvements" element={<Mouvements />} />
        <Route path="/produits" element={<Produits />} />
        <Route path="/compositions" element={<Compositions />} />
        <Route path="/ordres" element={<Ordres />} />
        <Route path="/ordres/nouveau" element={<OrdreCreate />} />
        <Route path="/ordres/:id" element={<OrdreDetail />} />
      </Route>

      {/* Operator Module Routes (ADMIN and OPERATEUR) */}
      <Route
        element={
          <ProtectedRoute allowedRoles={['ADMIN', 'OPERATEUR']}>
            <OperatorLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/operator" element={<OperatorDashboard />} />
      </Route>

      {/* 404 Catch-All */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
