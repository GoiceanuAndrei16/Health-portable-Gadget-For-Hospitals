import { Navigate } from 'react-router-dom'

function ProtectedRoute({ children, allowedRoles = [] }) {
  const esteAutentificat = sessionStorage.getItem('autentificat')
  const rol = sessionStorage.getItem('rol')
  
  if (!esteAutentificat) {
    return <Navigate to="/" />
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(rol)) {
    if (rol === 'medic') return <Navigate to="/medic" />
    if (rol === 'pacient') return <Navigate to="/pacient" />
    if (rol === 'admin') return <Navigate to="/admin" />
    return <Navigate to="/" />
  }
  
  return children
}

export default ProtectedRoute