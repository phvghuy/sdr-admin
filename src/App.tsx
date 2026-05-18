import { Routes, Route, Navigate } from 'react-router-dom'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import Orders from '@/pages/Orders'
import RoutesPage from '@/pages/Routes'
import Import from '@/pages/Import'
import Optimize from '@/pages/Optimize'
import Vehicles from '@/pages/Vehicles'
import Warehouses from '@/pages/Warehouses'
import AppLayout from './components/layout/AppLayout'

function isAuthenticated() {
  return !!localStorage.getItem('access_token')
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  if (!isAuthenticated()) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/import" element={<Import />} />
        <Route path="/optimize" element={<Optimize />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/vehicles" element={<Vehicles />} />
        <Route path="/warehouses" element={<Warehouses />} />
        <Route path="/routes" element={<RoutesPage />} />
      </Route>
      <Route path="/login" element={<Login />} />
      <Route path="*" element={<Navigate to={isAuthenticated() ? '/dashboard' : '/login'} replace />} />
    </Routes>
  )
}
