import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

type NavItem = {
  to: string
  label: string
  icon: React.ReactNode
}

const iconClass = 'material-symbols-rounded text-[22px]'

const NAV_ITEMS: NavItem[] = [
  {
    to: '/home',
    label: 'Inicio',
    icon: <span className={iconClass}>home</span>,
  },
  {
    to: '/pacientes',
    label: 'Pacientes',
    icon: <span className={iconClass}>group</span>,
  },
  {
    to: '/sesiones',
    label: 'Sesiones',
    icon: <span className={iconClass}>sports_gymnastics</span>,
  },
  {
    to: '/estadisticas',
    label: 'Estadísticas',
    icon: <span className={iconClass}>monitoring</span>,
  },
  {
    to: '/configuracion',
    label: 'Configuración',
    icon: <span className={iconClass}>settings</span>,
  },
]

export default function AppLayout() {
  const { user, logout } = useAuth()
  const initials = `${user?.nombre?.[0] ?? ''}${user?.apellido?.[0] ?? ''}`.toUpperCase() || '?'

  return (
    <div className="min-h-screen bg-bg-home flex">
      {/* Sidebar */}
      <aside className="w-[260px] flex-shrink-0 bg-primary text-white hidden md:flex flex-col sticky top-0 h-screen">
        <div className="px-6 py-6 flex items-center gap-3">
          <span className="material-symbols-rounded text-[28px]">self_improvement</span>
          <span className="text-xl font-black tracking-tight">Kinetix</span>
        </div>

        <nav className="flex-1 px-4 space-y-1 mt-2">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-[14px] text-sm font-semibold transition-colors ` +
                (isActive
                  ? 'bg-white/15 text-white shadow-inner'
                  : 'text-white/70 hover:bg-white/8 hover:text-white')
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
            className="w-full flex items-center gap-3 px-4 py-3 rounded-[14px] text-sm font-semibold text-white/70 hover:bg-white/8 hover:text-white transition-colors"
          >
            <span className={iconClass}>logout</span>
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white/70 backdrop-blur border-b border-accent/10 px-6 py-4 flex items-center justify-between sticky top-0 z-40">
          <NavLink to="/home" className="md:hidden font-black text-primary text-xl">
            Kinetix
          </NavLink>

          <div className="hidden md:flex items-center gap-2 text-text-muted">
            <span className="material-symbols-rounded text-[20px]">join_full</span>
            <span className="text-sm font-semibold">Panel del kinesiólogo</span>
          </div>

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