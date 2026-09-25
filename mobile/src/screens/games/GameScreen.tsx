// Pantalla universal para los juegos con cámara (Estrellas, Flamenco).
// En vez de reimplementar la detección de pose en nativo, carga la versión
// web ya afinada (MediaPipe + Phaser) dentro de un WebView. El permiso de
// cámara lo otorga el sistema operativo, no hace falta lógica nativa propia.
import { useRef, useState, useCallback } from 'react'
import { View, StyleSheet, TouchableOpacity, Text, SafeAreaView, ActivityIndicator } from 'react-native'
import { WebView } from 'react-native-webview'
import { useNavigation, useRoute } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RootStackParamList } from '../../navigation/AppNavigator'
import { GAME_SERVER_URL } from '../../lib/config'
import { colors, radius } from '../../lib/theme'

const HEADER_H = 48

const JUEGOS: Record<string, { path: string; label: string; bg: string }> = {
  Estrellas: { path: '/juego/estrellas', label: 'Estrellas', bg: '#0a0a1a' },
  Flamenco:  { path: '/juego/flamenco',  label: 'Flamenco',  bg: '#1a1a2e' },
}

type Nav = NativeStackNavigationProp<RootStackParamList>

export default function GameScreen() {
  const navigation = useNavigation<Nav>()
  const route = useRoute()
  const juego = JUEGOS[route.name] ?? JUEGOS.Estrellas

  const webviewRef = useRef<WebView>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(false)

  const reintentar = useCallback(() => {
    setError(false)
    setCargando(true)
    webviewRef.current?.reload()
  }, [])

  return (
    <View style={[s.root, { backgroundColor: juego.bg }]}>
      <SafeAreaView style={s.safeHeader}>
        <View style={s.header}>
          <View style={s.logoRow}>
            <Text style={s.logoK}>K</Text>
            <Text style={s.logoRest}>inetix</Text>
            <Text style={s.gameLabel}> — {juego.label}</Text>
          </View>
          <TouchableOpacity style={s.btnBack} onPress={() => navigation.goBack()}>
            <Text style={s.btnBackText}>↩</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <WebView
        ref={webviewRef}
        source={{ uri: `${GAME_SERVER_URL}${juego.path}` }}
        style={s.webview}
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        mediaCapturePermissionGrantType="grant"
        originWhitelist={['*']}
        onLoadEnd={() => setCargando(false)}
        onError={() => { setCargando(false); setError(true) }}
        onHttpError={() => { setCargando(false); setError(true) }}
      />

      {cargando && !error && (
        <View style={s.overlay} pointerEvents="none">
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      )}

      {error && (
        <View style={s.overlay}>
          <Text style={s.errorText}>No se pudo conectar al servidor.</Text>
          <Text style={s.errorSub}>Verificá que la PC esté prendida y el túnel activo.</Text>
          <TouchableOpacity style={s.retryBtn} onPress={reintentar}>
            <Text style={s.retryBtnText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1 },
  safeHeader: { backgroundColor: '#dde3f0' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, height: HEADER_H,
  },
  logoRow: { flexDirection: 'row', alignItems: 'baseline' },
  logoK: { fontSize: 20, fontWeight: '900', color: colors.accent },
  logoRest: { fontSize: 18, fontWeight: '800', color: colors.primary },
  gameLabel: { fontSize: 12, color: '#555', fontWeight: '600' },
  btnBack: { backgroundColor: colors.primary, borderRadius: radius.full, paddingHorizontal: 14, paddingVertical: 7 },
  btnBackText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  webview: { flex: 1, backgroundColor: 'transparent' },
  overlay: {
    position: 'absolute', top: HEADER_H, left: 0, right: 0, bottom: 0,
    alignItems: 'center', justifyContent: 'center', gap: 14, padding: 32,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  errorText: { color: '#fff', fontSize: 17, fontWeight: '700', textAlign: 'center' },
  errorSub: { color: '#ccc', fontSize: 13, textAlign: 'center' },
  retryBtn: { backgroundColor: colors.accent, borderRadius: radius.full, paddingHorizontal: 24, paddingVertical: 12, marginTop: 8 },
  retryBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
})
