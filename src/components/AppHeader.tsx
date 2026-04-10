import { User } from 'lucide-react'
import { Link } from 'react-router-dom'

export function AppHeader() {
  return (
    <header
      className="sticky top-0 z-40 flex items-center justify-between px-4 py-3 glass-panel-strong rounded-b-3xl"
      role="banner"
    >
      <Link to="/" className="flex items-center gap-2" aria-label="Click to Clean home">
        <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 text-xs font-black text-white shadow-md">
          C2C
        </span>
        <span className="text-base font-bold tracking-tight text-slate-900">Click to Clean</span>
      </Link>
      <Link
        to="/profile"
        className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200/90 ring-2 ring-white/80"
        aria-label="Open profile"
      >
        <User className="h-5 w-5 text-slate-700" aria-hidden />
      </Link>
    </header>
  )
}
