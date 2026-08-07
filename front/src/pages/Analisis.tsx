export default function Analisis() {
  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-black text-primary">Análisis</h1>
        <p className="text-text-muted font-medium mt-1">
          Evolución, métricas y progreso de los pacientes.
        </p>
      </div>

      <div className="bg-white rounded-[18px] shadow-[0_6px_24px_-12px_rgba(43,49,156,0.15)] p-10 text-center">
        <span className="material-symbols-rounded text-[52px] text-text-placeholder">bar_chart</span>
        <h2 className="text-text-label font-black text-lg mt-4">Estadísticas próximamente</h2>
        <p className="text-text-muted text-sm font-medium mt-1 max-w-sm mx-auto">
          Acá vas a ver la evolución de cada paciente, promedios globales y el progreso entre
          sesiones. Disponible en el Sprint 6.
        </p>
      </div>
    </div>
  )
}
