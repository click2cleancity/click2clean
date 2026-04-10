import { Navigate, Outlet } from 'react-router-dom'
import { getVerified } from '../lib/storage'
import { getResumeSetupPath } from '../lib/setup'

export function RequireAuth() {
  if (!getVerified()) {
    return <Navigate to={getResumeSetupPath()} replace />
  }
  return <Outlet />
}
