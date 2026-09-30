// Toda la app corre dentro de un WebView apuntando a la web completa (front/).
// Login, dashboard, pacientes, sesiones, juegos: todo vive en un solo lugar
// (front/) y la app mobile simplemente lo muestra. Cualquier cambio que se
// haga en la web se refleja acá solo, sin tocar este proyecto.
import { useRef, useState, useCallback, useEffect } from 'react'
import { View, StyleSheet, BackHandler, ActivityIndicator, Text, TouchableOpacity, Platform } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { WebView, type WebViewNavigation } from 'react-native-webview'
import type { WebViewErrorEvent, WebViewHttpErrorEvent } from 'react-native-webview/lib/WebViewTypes'
import { GAME_SERVER_URL } from '../lib/config'

// Google bloquea el login OAuth dentro de cualquier WebView embebido (política
// "disallowed_useragent"), independientemente de si el resto de la app anda
// bien. Sin este filtro, ese bloqueo se mostraba como si el servidor estuviera
// caído.
function esNavegacionDeGoogle(url: string) {
  try {
    const host = new URL(url).hostname
    return host === 'accounts.google.com' || host.endsWith('.google.com')
  } catch {
    return false
  }
}

export default function WebAppScreen() {
  const webviewRef = useRef<WebView>(null)
  const canGoBackRef = useRef(false)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(false)
  const [avisoGoogle, setAvisoGoogle] = useState(false)

  useEffect(() => {
    if (Platform.OS !== 'android') return
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (canGoBackRef.current) {
        webviewRef.current?.goBack()
        return true
      }
      return false
    })
    return () => sub.remove()
  }, [])

  const onNavigationStateChange = useCallback((nav: WebViewNavigation) => {
    canGoBackRef.current = nav.canGoBack
  }, [])

  const manejarFallo = useCallback((url: string) => {
    setCargando(false)
    if (esNavegacionDeGoogle(url)) {
      // No es una caída real: Google rechazó el intento de login embebido.
      // Volvemos a la app y mostramos un aviso chico en vez de tapar todo.
      setAvisoGoogle(true)
      webviewRef.current?.goBack()
      setTimeout(() => setAvisoGoogle(false), 4000)
    } else {
      setError(true)
    }
  }, [])

  const reintentar = useCallback(() => {
    setError(false)
    setCargando(true)
    webviewRef.current?.reload()
  }, [])

  const irAJuegos = useCallback(() => {
    // /juego es público (no pide login) y lista los 3 juegos — ver App.jsx.
    const destino = `${new URL(GAME_SERVER_URL).origin}/juego`
    webviewRef.current?.injectJavaScript(`window.location.href = ${JSON.stringify(destino)}; true;`)
  }, [])

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <WebView
        ref={webviewRef}
        source={{ uri: GAME_SERVER_URL }}
        style={s.webview}
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        mediaCapturePermissionGrantType="grant"
        originWhitelist={['*']}
        sharedCookiesEnabled
        onNavigationStateChange={onNavigationStateChange}
        onLoadEnd={() => setCargando(false)}
        onError={(e: WebViewErrorEvent) => manejarFallo(e.nativeEvent.url)}
        onHttpError={(e: WebViewHttpErrorEvent) => manejarFallo(e.nativeEvent.url)}
      />

      {cargando && !error && (
        <View style={s.overlay} pointerEvents="none">
          <ActivityIndicator size="large" color="#e91e8c" />
        </View>
      )}

      {error && (
        <View style={s.overlay}>
          <Text style={s.errorText}>No se pudo cargar la app.</Text>
          <Text style={s.errorSub}>Revisá tu conexión a internet.</Text>
          <TouchableOpacity style={s.retryBtn} onPress={reintentar}>
            <Text style={s.retryBtnText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      )}

      {avisoGoogle && (
        <View style={s.banner} pointerEvents="none">
          <Text style={s.bannerText}>El login con Google no funciona en la app. Usá email y contraseña.</Text>
        </View>
      )}

      {!cargando && !error && (
        <TouchableOpacity style={s.fabJuegos} onPress={irAJuegos} activeOpacity={0.85}>
          <Text style={s.fabJuegosIcon}>🎮</Text>
          <Text style={s.fabJuegosText}>Juegos</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f0f4ff' },
  webview: { flex: 1, backgroundColor: 'transparent' },
  banner: {
    position: 'absolute', top: 12, left: 16, right: 16,
    backgroundColor: 'rgba(26,26,46,0.92)', borderRadius: 12, padding: 14,
  },
  bannerText: { color: '#fff', fontSize: 13, fontWeight: '600', textAlign: 'center' },
  overlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center', justifyContent: 'center', gap: 14, padding: 32,
    backgroundColor: 'rgba(240,244,255,0.95)',
  },
  errorText: { color: '#1a1a2e', fontSize: 17, fontWeight: '700', textAlign: 'center' },
  errorSub: { color: '#6b7280', fontSize: 13, textAlign: 'center' },
  retryBtn: { backgroundColor: '#e91e8c', borderRadius: 999, paddingHorizontal: 24, paddingVertical: 12, marginTop: 8 },
  retryBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  fabJuegos: {
    position: 'absolute', bottom: 24, right: 20,
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#e91e8c', borderRadius: 999,
    paddingVertical: 12, paddingHorizontal: 18,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 6,
    elevation: 6,
  },
  fabJuegosIcon: { fontSize: 18 },
  fabJuegosText: { color: '#fff', fontSize: 15, fontWeight: '700' },
})
