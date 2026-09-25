import { useRef, useState } from 'react'
import { api } from '../../lib/api'
import { useAuth } from '../../context/AuthContext'

const MAX_FOTO_BYTES = 5 * 1024 * 1024

export default function ConfiguracionModal({ onClose }: { onClose: () => void }) {
  const { user, updateUser, logout } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [nombre, setNombre] = useState(user?.nombre ?? '')
  const [apellido, setApellido] = useState(user?.apellido ?? '')
  const [subiendoFoto, setSubiendoFoto] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [enviandoReset, setEnviandoReset] = useState(false)
  const [resetEnviado, setResetEnviado] = useState(false)

  async function handleFoto(file: File | undefined) {
    if (!file) return
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setError('Solo se aceptan imágenes JPG o PNG.')
      return
    }
    if (file.size > MAX_FOTO_BYTES) {
      setError('La imagen no puede pesar más de 5MB.')
      return
    }

    setError(null)
    setSubiendoFoto(true)
    try {
      const token = localStorage.getItem('kinetix_token')
      const formData = new FormData()
      formData.append('avatar', file)
      const { url } = await api.post<{ url: string }>('/upload/avatar', formData, { token })
      await updateUser({ avatar_url: url })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo subir la foto')
    } finally {
      setSubiendoFoto(false)
    }
  }

  async function handleGuardar() {
    setError(null)
    setGuardando(true)
    try {
      await updateUser({ nombre: nombre.trim(), apellido: apellido.trim() })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron guardar los cambios')
    } finally {
      setGuardando(false)
    }
  }

  async function handleCambiarContraseña() {
    if (!user?.email) return
    setError(null)
    setEnviandoReset(true)
    try {
      await api.post('/auth/forgot-password', { email: user.email })
      setResetEnviado(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo enviar el link')
    } finally {
      setEnviandoReset(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-primary/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[24px] shadow-xl w-full max-w-sm p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-primary font-black text-lg">Configuración</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-text-muted hover:bg-bg-input transition-colors"
            aria-label="Cerrar"
          >
            <span className="material-symbols-rounded text-[20px]">close</span>
          </button>
        </div>

        <div className="flex flex-col items-center mb-6">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png"
            className="hidden"
            onChange={(e) => handleFoto(e.target.files?.[0])}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={subiendoFoto}
            className="w-24 h-24 rounded-full border-2 border-dashed border-accent flex items-center justify-center overflow-hidden bg-bg-input hover:bg-accent/10 transition-colors disabled:opacity-60"
          >
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt={user.nombre} className="w-full h-full object-cover" />
            ) : (
              <span className="material-symbols-rounded text-[32px] text-accent">photo_camera</span>
            )}
          </button>
          <p className="text-text-muted text-xs font-semibold mt-2">
            {subiendoFoto ? 'Subiendo…' : 'Tocá para cambiar la foto'}
          </p>
        </div>

        <div className="space-y-4">
          <label className="flex flex-col gap-2">
            <span className="text-text-label text-sm font-bold">Nombre</span>
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="h-[46px] bg-bg-input rounded-[14px] px-4 text-sm font-medium text-text-label outline-none focus:ring-2 focus:ring-accent/40"
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-text-label text-sm font-bold">Apellido</span>
            <input
              value={apellido}
              onChange={(e) => setApellido(e.target.value)}
              className="h-[46px] bg-bg-input rounded-[14px] px-4 text-sm font-medium text-text-label outline-none focus:ring-2 focus:ring-accent/40"
            />
          </label>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-100">
          <p className="text-text-label text-sm font-bold mb-2">Contraseña</p>
          {resetEnviado ? (
            <p className="text-text-muted text-xs font-medium bg-violet-50 rounded-[12px] px-3 py-2.5">
              Te enviamos un link a {user?.email} para cambiarla. Revisá tu bandeja de entrada.
            </p>
          ) : (
            <button
              onClick={handleCambiarContraseña}
              disabled={enviandoReset}
              className="w-full flex items-center justify-center gap-2 rounded-full border border-accent/40 text-accent text-sm font-bold h-[44px] hover:bg-accent hover:text-white transition-colors disabled:opacity-70"
            >
              <span className="material-symbols-rounded text-[18px]">key</span>
              {enviandoReset ? 'Enviando…' : 'Cambiar contraseña'}
            </button>
          )}
        </div>

        {error && (
          <p className="text-rose-600 text-xs font-semibold mt-4">{error}</p>
        )}

        <button
          onClick={handleGuardar}
          disabled={guardando}
          className="w-full rounded-full bg-accent text-white font-black h-[48px] mt-6 hover:bg-[#C83890] transition-colors disabled:opacity-70"
        >
          {guardando ? 'Guardando…' : 'Guardar cambios'}
        </button>

        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 rounded-full border border-rose-200 text-rose-500 font-bold h-[48px] mt-3 hover:bg-rose-50 transition-colors"
        >
          <span className="material-symbols-rounded text-[18px]">logout</span>
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}
