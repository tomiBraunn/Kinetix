import { useAuth } from '../context/AuthContext'

export default function Home() {
  const { user, logout } = useAuth()
  const initials = `${user?.nombre?.[0] ?? ''}${user?.apellido?.[0] ?? ''}`.toUpperCase() || '?'

  return (
    <div className="min-h-screen bg-[#FBF8FF]">
      <header className="bg-[#F0F2FF] px-8 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <button className="text-[#25309C]" aria-label="Menu">
            <svg width="24" height="16" viewBox="0 0 24 16" fill="none">
              <path d="M2 2H22M2 8H22M2 14H22" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          </button>
          <h1 className="text-[#2B319C] text-2xl font-medium tracking-tight">Kinetix</h1>
        </div>
        <div className="flex items-center gap-4">
          <button className="relative text-[#0F1387]" aria-label="Notifications">
            <svg width="20" height="22" viewBox="0 0 20 22" fill="none">
              <path d="M10 2C7.5 2 5.5 4 5.5 6.5V10L3.5 14H16.5L14.5 10V6.5C14.5 4 12.5 2 10 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M8 17C8 18.1 8.9 19 10 19C11.1 19 12 18.1 12 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#FD5DA8] rounded-full"></span>
          </button>
          {user?.avatar_url ? (
            <img src={user.avatar_url} alt={user.nombre} className="w-8 h-8 rounded-full object-cover border-2 border-[#E040A0]/20" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-[#2B319C] text-white text-sm font-bold flex items-center justify-center">
              {initials}
            </div>
          )}
          <span className="text-[#604868] text-sm font-semibold hidden md:block">
            {user?.nombre} {user?.apellido}
          </span>
          <button onClick={logout} className="text-[#604868] text-sm font-semibold hover:text-[#E040A0]">
            Salir
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-8">
        <div className="bg-[#2B319C] rounded-[20px] h-[200px] mb-8 flex items-center justify-end px-10 relative overflow-hidden">
          <svg width="120" height="120" viewBox="0 0 120 120" fill="none" className="opacity-20">
            <path d="M30 90L60 30L90 90" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="60" cy="70" r="8" fill="white"/>
          </svg>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-[16px] p-6 shadow-sm border-b-4 border-[#E040A0]">
            <svg width="24" height="20" viewBox="0 0 24 20" fill="none" className="mb-2">
              <path d="M4 14C4 11 6.5 9 10 9C13.5 9 16 11 16 14" stroke="#E040A0" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="10" cy="5" r="3" stroke="#E040A0" strokeWidth="2"/>
              <path d="M14 14C14 12 15.5 10.5 18 10.5C20.5 10.5 22 12 22 14" stroke="#E040A0" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="18" cy="7" r="2" stroke="#E040A0" strokeWidth="2"/>
            </svg>
            <p className="text-[#E040A0] text-3xl font-bold">30</p>
            <p className="text-[#767684] text-sm font-medium">Pacientes activos</p>
          </div>

          <div className="bg-white rounded-[16px] p-6 shadow-sm border-b-4 border-[#E040A0]">
            <svg width="28" height="22" viewBox="0 0 28 22" fill="none" className="mb-2">
              <circle cx="14" cy="11" r="9" stroke="#E040A0" strokeWidth="2"/>
              <path d="M9 11L12 14L19 7" stroke="#E040A0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <p className="text-[#E040A0] text-3xl font-bold">12</p>
            <p className="text-[#767684] text-sm font-medium">Sesiones Hoy</p>
          </div>
        </div>

        <div className="bg-white rounded-[16px] p-6 shadow-sm border-b-4 border-[#E040A0] mb-6">
          <p className="text-[#1B1B22] text-sm font-bold mb-1">Tus Pacientes</p>
          <p className="text-[#E040A0] text-3xl font-bold mb-1">345</p>
          <p className="text-[#767684] text-sm">Total de pacientes registrados en tu clínica.</p>
        </div>

        <div className="bg-gradient-to-r from-[#F82192] via-[#FF5FAA] to-[#FFABC0] rounded-[16px] p-8 mb-6 relative overflow-hidden">
          <div className="relative z-10 max-w-lg">
            <h2 className="text-white text-3xl font-bold leading-tight mb-3">
              Cada movimiento cuenta, pero cada sonrisa también.
            </h2>
            <p className="text-white/90 text-sm font-medium">Tu ayuda hoy transforma vidas.</p>
          </div>
          <div className="absolute right-8 top-1/2 -translate-y-1/2 opacity-30">
            <svg width="120" height="100" viewBox="0 0 120 100" fill="none">
              <path d="M20 40C20 40 35 25 60 25C85 25 100 40 100 40" stroke="white" strokeWidth="3" strokeLinecap="round"/>
              <circle cx="40" cy="35" r="4" fill="white"/>
              <circle cx="80" cy="35" r="4" fill="white"/>
              <path d="M40 55C40 55 50 70 60 70C70 70 80 55 80 55" stroke="white" strokeWidth="3" strokeLinecap="round"/>
            </svg>
          </div>
        </div>

        <div className="bg-[#2B319C] rounded-[16px] p-8 flex items-start gap-6">
          <div className="w-10 h-10 rounded-full bg-[#0F1387] flex items-center justify-center flex-shrink-0 mt-1">
            <svg width="18" height="22" viewBox="0 0 18 22" fill="none">
              <path d="M9 2C6 2 3.5 4.5 3.5 7.5C3.5 9.5 4.5 11 6 12V15C6 16 7 17 8 17H10C11 17 12 16 12 15V12C13.5 11 14.5 9.5 14.5 7.5C14.5 4.5 12 2 9 2Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M7 19H11" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M8 21H10" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <p className="text-white/70 text-xs font-medium uppercase tracking-wider mb-2">Consejo del día</p>
            <h3 className="text-white text-xl font-bold mb-2">Optimiza el descanso</h3>
            <p className="text-white/80 text-sm">Pacientes con 8h de sueño recuperan 20% más rápido.</p>
          </div>
        </div>
      </main>
    </div>
  )
}
