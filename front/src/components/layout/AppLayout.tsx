import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Logo from '../Logo'

type NavItem = {
  to: string
  label: string
  icon: React.ReactNode
}

const iconClass = 'material-symbols-rounded text-[22px]'

const NAV_ITEMS: NavItem[] = [
  {
    to: '/home',
    label: 'Home',
    icon: <span className={iconClass}>home</span>,
  },
  {
    to: '/pacientes',
    label: 'Pacientes',
    icon: <span className={iconClass}>group</span>,
  },
  {
    to: '/games',
    label: 'Juegos',
    icon: <span className={iconClass}>sports_esports</span>,
  },
  {
    to: '/analisis',
    label: 'Análisis',
    icon: <span className={iconClass}>bar_chart</span>,
  },
]

export default function AppLayout() {
  const { user, logout } = useAuth()
  const initials = `${user?.nombre?.[0] ?? ''}${user?.apellido?.[0] ?? ''}`.toUpperCase() || '?'

  return (
    <div className="min-h-screen bg-bg-home flex">
      {/* Sidebar */}
      <aside className="w-[260px] flex-shrink-0 bg-[#F0F2FF] hidden md:flex flex-col sticky top-0 h-screen border-r border-primary/10">
        <div className="px-6 py-6">
          <NavLink to="/home">
            <Logo />
          </NavLink>
        </div>

        <nav className="flex-1 px-4 space-y-1 mt-2">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-[14px] text-sm font-semibold transition-colors ` +
                (isActive
                  ? 'bg-primary text-white rounded-[20px]'
                  : 'text-text-label hover:bg-primary/8 hover:text-primary')
              }
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-[14px] text-sm font-semibold text-text-label hover:bg-primary/8 hover:text-primary transition-colors"
          >
            <span className={iconClass}>logout</span>
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white/70 backdrop-blur border-b border-accent/10 px-6 py-4 flex items-center justify-between sticky top-0 z-40">
          <NavLink to="/home" className="md:hidden">
            <Logo />
          </NavLink>

          <div className="flex items-center gap-3 ml-auto">
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.nombre}
                className="w-9 h-9 rounded-full object-cover border-2 border-accent/30"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-accent text-white text-sm font-bold flex items-center justify-center">
                {initials}
              </div>
            )}
            <div className="hidden sm:block leading-tight">
              <p className="text-text-label text-sm font-bold">{user?.nombre} {user?.apellido}</p>
              <p className="text-text-muted text-xs font-medium">Kinesiólogo</p>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}