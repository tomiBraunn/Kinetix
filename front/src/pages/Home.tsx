import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Skeleton } from "boneyard-js/react";
import logoMark from "../assets/logo-mark.png";
import smiles from "../assets/smiles.svg";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { nombreCompleto, iniciales, type Paciente } from "../lib/pacientes";

type DashboardResumen = {
  total_pacientes: number | null;
  pacientes_activos: number | null;
  sesiones_hoy: number | null;
};

function StatCard({
  icon,
  label,
  value,
  title,
  description,
  iconRight,
  className,
}: {
  icon?: string;
  label: string;
  value: number | null;
  title?: string;
  description?: string;
  iconRight?: string;
  className?: string;
}) {
  return (
    <div className={`bg-white rounded-[18px] p-6 shadow-[0_6px_24px_-12px_rgba(43,49,156,0.15)] border-b-4 border-accent ${className ?? ""}`}>
      <div className="flex items-start justify-between mb-4">
        {title ? (
          <p className="text-text-label font-black text-sm">{title}</p>
        ) : icon ? (
          <span className="material-symbols-rounded text-[28px] text-accent">
            {icon}
          </span>
        ) : null}
        {iconRight && (
          <span className="material-symbols-rounded text-[28px] text-accent">
            {iconRight}
          </span>
        )}
      </div>
      <p className="text-4xl font-black text-accent">{value ?? "—"}</p>
      <p className="text-text-muted text-sm font-semibold mt-1">{description || label}</p>
    </div>
  );
}

// Esqueleto de la página completa: mismas medidas/radios que el layout real
// (incluidos los paneles hardcodeados) para que no haya salto al terminar de cargar.
function HomeSkeleton() {
  return (
    <div className="max-w-6xl mx-auto animate-pulse">
      <div className="mb-8 rounded-4xl min-w-full h-80 bg-slate-200" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-[150px] rounded-[18px] bg-slate-200 ${i === 4 ? "lg:col-span-2" : ""}`}
          />
        ))}
      </div>

      <div className="bg-white rounded-[18px] shadow-[0_6px_24px_-12px_rgba(43,49,156,0.15)] overflow-hidden">
        <div className="h-[68px] border-b border-slate-100" />
        <ul className="divide-y divide-slate-50">
          {[0, 1, 2, 3, 4].map((i) => (
            <li key={i} className="flex items-center gap-4 px-6 py-4">
              <div className="w-10 h-10 rounded-full bg-slate-200" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-3.5 w-32 rounded bg-slate-200" />
                <div className="h-3 w-24 rounded bg-slate-100" />
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-[172px] rounded-[18px] bg-slate-200" />
        <div className="h-[172px] rounded-[18px] bg-slate-200" />
      </div>
    </div>
  );
}

export default function Home() {
  const { user } = useAuth();
  const [resumen, setResumen] = useState<DashboardResumen | null>(null);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const primerNombre = user?.nombre?.split(" ")[0] ?? "";

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const [dash, pac] = await Promise.all([
          api.get<DashboardResumen>("/dashboard", {
            token: localStorage.getItem("kinetix_token"),
          }),
          api.get<Paciente[]>("/pacientes", {
            token: localStorage.getItem("kinetix_token"),
          }),
        ]);
        if (!active) return;
        setResumen(dash);
        setPacientes(pac);
      } catch (err) {
        if (!active) return;
        setError(
          err instanceof Error ? err.message : "No se pudo cargar el panel",
        );
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  const ultimosPacientes = pacientes.slice(0, 5);

  return (
    <Skeleton name="home-dashboard" loading={loading} fallback={<HomeSkeleton />}>
    <div className="max-w-6xl mx-auto">
      <div className="flex items-start sm:items-start sm:justify-between gap-4 mb-8 bg-primary rounded-4xl min-w-full h-80 p-8">
        <div className="flex flex-col justify-between min-h-full">
          <div className="flex flex-col gap-2">
            <h1 className="text-5xl font-black text-white">
              Hola, {primerNombre || "Kinesiólogo"}
            </h1>
            <p className="text-text-soft font-medium mt-1 max-w-xl">
              Bienvenido a Kinetix. Permití que tus pacientes se rehabiliten de
              una forma más divertida a través de juegos interactivos, mientras
              monitoreás su progreso y desempeño en tiempo real.{" "}
            </p>
          </div>
          <Link
            to="/pacientes/nuevo"
            className=" w-64 inline-flex items-center gap-2 rounded-full bg-accent text-white text-sm font-bold px-6 py-3 hover:bg-[#C83890] transition-colors shadow-[0_12px_24px_-12px_rgba(224,64,160,0.6)]"
          >
            <span className="material-symbols-rounded text-[18px]">
              person_add
            </span>
            Agendar nuevo paciente
          </Link>
        </div>
        <div className="min-h-full flex items-center justify-center relative">
          <img
            src={logoMark}
            alt=""
            aria-hidden="true"
            className="w-56 brightness-0 invert opacity-25 -rotate-21"
          />
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-600 rounded-[14px] px-4 py-3 mb-6 text-sm font-semibold">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <StatCard
          icon="group"
          label="Pacientes activos"
          value={resumen?.pacientes_activos ?? null}
        />
        <StatCard
          icon="check_circle"
          label="Sesiones hoy"
          value={resumen?.sesiones_hoy ?? null}
        />
        <StatCard
          icon="sports_esports"
          label="Juegos disponibles"
          value={3}
        />
        <StatCard
          title="Tus Pacientes"
          iconRight="group"
          label="Total de pacientes registrados en tu clínica."
          value={resumen?.total_pacientes ?? null}
          className="lg:col-span-2"
        />
      </div>

      <div className="bg-white rounded-[18px] shadow-[0_6px_24px_-12px_rgba(43,49,156,0.15)] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <h2 className="text-primary font-black text-lg">Tus pacientes</h2>
          <Link
            to="/pacientes"
            className="text-accent text-sm font-bold hover:underline inline-flex items-center gap-1"
          >
            Ver todos
            <span className="material-symbols-rounded text-[18px]">
              arrow_forward
            </span>
          </Link>
        </div>

        {ultimosPacientes.length === 0 ? (
          <div className="p-10 text-center">
            <span className="material-symbols-rounded text-[40px] text-text-placeholder">
              group
            </span>
            <p className="text-text-muted font-semibold mt-3">
              Todavía no tenés pacientes cargados.
            </p>
            <Link
              to="/pacientes/nuevo"
              className="inline-flex items-center gap-2 rounded-full bg-accent text-white text-sm font-bold px-5 py-2.5 mt-4 hover:bg-[#C83890] transition-colors"
            >
              <span className="material-symbols-rounded text-[18px]">
                person_add
              </span>
              Agregar el primero
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-slate-50">
            {ultimosPacientes.map((p) => (
              <li key={p.id}>
                <Link
                  to={`/pacientes/${p.id}`}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-bg-header/60 transition-colors"
                >
                  {p.avatar_url ? (
                    <img
                      src={p.avatar_url}
                      alt={nombreCompleto(p)}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary text-white text-sm font-bold flex items-center justify-center">
                      {iniciales(p)}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-text-label font-bold truncate">
                      {nombreCompleto(p)}
                    </p>
                    <p className="text-text-muted text-sm font-medium truncate">
                      {p.tipo_lesion || "Sin lesión registrada"}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div
          className="lg:col-span-4 rounded-[18px] p-8 text-white relative overflow-hidden"
          style={{
            background:
              "linear-gradient(90deg, #F82192 9.79%, #FF5FAA 53.41%, #FF89B5 75.23%, #FFAAC0 97.04%)",
          }}
        >
          <img
            src={smiles}
            alt=""
            aria-hidden="true"
            className="absolute right-4 top-1/2 -translate-y-1/2 w-40 h-40 opacity-70 pointer-events-none"
          />
          <p className="text-3xl sm:text-4xl font-black leading-tight max-w-lg">
            Cada movimiento cuenta, pero cada sonrisa también.
          </p>
          <p className="text-white/90 text-lg font-semibold mt-3">
            Tu ayuda hoy transforma vidas.
          </p>
        </div>

        <div className="lg:col-span-1 bg-primary rounded-[18px] p-6 text-white relative overflow-hidden">
          <span className="material-symbols-rounded absolute top-5 right-5 text-[22px] text-accent">
            lightbulb
          </span>
          <p className="text-white/80 text-xs font-bold uppercase tracking-wider mb-3">
            Consejo del día
          </p>
          <p className="text-lg font-bold leading-snug mb-2">
            Optimiza el
            <br />
            Descanso
          </p>
          <p className="text-white/70 text-sm font-medium leading-snug">
            Pacientes con 8h de sueño
            <br />
            recuperan 20% más rápido.
          </p>
        </div>
      </div>
    </div>
    </Skeleton>
  );
}
