import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import DashboardMedic from './pages/DashboardMedic'
import DashboardPacient from './pages/DashboardPacient'
import FisaPacient from './pages/FisaPacient'
import ProtectedRoute from './components/ProtectedRoute'
import ConfigurareContPacient from './pages/ConfigurareContPacient'
import DashboardAdmin from './pages/DashboardAdmin'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/configurare" element={
          <ProtectedRoute allowedRoles={['pacient']}>
            <ConfigurareContPacient />
          </ProtectedRoute>
        } />
        <Route path="/medic" element={
          <ProtectedRoute allowedRoles={['medic']}>
            <DashboardMedic />
          </ProtectedRoute>
        } />
        <Route path="/pacient" element={
          <ProtectedRoute allowedRoles={['pacient']}>
            <DashboardPacient />
          </ProtectedRoute>
        } />
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <DashboardAdmin />
          </ProtectedRoute>
        } />
        <Route path="/fisa/:id" element={
          <ProtectedRoute allowedRoles={['medic', 'admin']}>
            <FisaPacient />
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  )
}

export default App