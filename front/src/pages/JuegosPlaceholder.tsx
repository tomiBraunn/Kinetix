export default function JuegosPlaceholder() {
  return (
    <div className="max-w-[1082px] mx-auto">
      <h1 className="text-[26px] lg:text-[30px] font-bold text-[#1a1f6e]">Juegos</h1>
      <p className="text-[14px] text-[#61698a] mt-1.5">Surf Challenge, Flamenco Challenge y Alcanzá la estrella.</p>
      <div className="bg-white border border-[#e0e3f5] rounded-[18px] shadow-[0_6px_18px_0_rgba(20,26,82,0.07)] p-10 mt-6 text-center">
        <span className="material-symbols-rounded text-[48px] text-text-placeholder">sports_esports</span>
        <p className="text-[#1a1f6e] font-bold mt-3">Los juegos se juegan desde la app de Kinetix</p>
        <p className="text-[#61698a] text-sm mt-1">
          Abrí la app en el dispositivo del paciente para iniciar una sesión. Acá vas a poder ver y administrar los juegos próximamente.
        </p>
      </div>
    </div>
  )
}
