import { Outlet } from 'react-router-dom'
import { AppHeader } from '../components/AppHeader'
import { BottomNav } from '../components/BottomNav'

export function MainLayout() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col pb-24">
      <AppHeader />
      <main className="flex-1 px-4 py-4" id="main-content">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
