import { Suspense, lazy } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ErrorBoundary } from './components/ErrorBoundary'
import { MainLayout } from './layouts/MainLayout'
import { RequireAuth } from './auth/RequireAuth'

const Splash = lazy(() => import('./pages/Splash'))
const Language = lazy(() => import('./pages/Language'))
const Onboarding = lazy(() => import('./pages/Onboarding'))
const PhoneEntry = lazy(() => import('./pages/Phone'))
const Otp = lazy(() => import('./pages/Otp'))
const Home = lazy(() => import('./pages/Home'))
const Issues = lazy(() => import('./pages/Issues'))
const Greetings = lazy(() => import('./pages/Greetings'))
const Earn = lazy(() => import('./pages/Earn'))
const Profile = lazy(() => import('./pages/Profile'))
const Educate = lazy(() => import('./pages/Educate'))
const ReportFlow = lazy(() => import('./pages/ReportFlow'))
const Success = lazy(() => import('./pages/Success'))

function PageLoader() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
    </div>
  )
}

/** GitHub Pages serves the app under /repo-name/ — must match vite `base` (import.meta.env.BASE_URL). */
function routerBasename(): string | undefined {
  const base = import.meta.env.BASE_URL
  if (base === '/') return undefined
  return base.endsWith('/') ? base.slice(0, -1) : base
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter basename={routerBasename()}>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/splash" element={<Splash />} />
            <Route path="/language" element={<Language />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/phone" element={<PhoneEntry />} />
            <Route path="/otp" element={<Otp />} />
            <Route element={<RequireAuth />}>
              <Route element={<MainLayout />}>
                <Route index element={<Home />} />
                <Route path="issues" element={<Issues />} />
                <Route path="greetings" element={<Greetings />} />
                <Route path="earn" element={<Earn />} />
                <Route path="profile" element={<Profile />} />
                <Route path="educate" element={<Educate />} />
              </Route>
              <Route path="report" element={<ReportFlow />} />
              <Route path="success" element={<Success />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ErrorBoundary>
  )
}
