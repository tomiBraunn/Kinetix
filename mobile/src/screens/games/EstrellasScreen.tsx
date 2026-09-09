import { useRef, useState, useEffect, useCallback } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Dimensions } from 'react-native'
import { CameraView, useCameraPermissions } from 'expo-camera'
import { Canvas, Circle, Path, Skia, Group } from '@shopify/react-native-skia'
import { useNavigation } from '@react-navigation/native'
import { usePoseDetection, LM, type Keypoint } from '../../ia/usePoseDetection'
import { colors, radius } from '../../lib/theme'

const { width: W, height: H } = Dimensions.get('window')
const HEADER_H    = 56
const GAME_H      = H - HEADER_H
const NUM_ESTRELLAS = 3
const RADIO       = 58     // radio en px (grande para portrait)
const HIT_RADIO   = RADIO * 1.6  // hitbox aumentado para compensar imprecisión del modelo
const DURACION    = 60

type Estrella = { id: number; x: number; y: number }

let nextId = 1
function crearEstrella(): Estrella {
  const margen = 72
  return {
    id: nextId++,
    x: margen + Math.random() * (W - margen * 2),
    y: HEADER_H + GAME_H * 0.13 + Math.random() * (GAME_H * 0.60),
  }
}

function dibujarEstrella(cx: number, cy: number, r: number) {
  const inner = r * 0.42
  const puntas = 5
  const path = Skia.Path.Make()
  for (let i = 0; i < puntas * 2; i++) {
    const radio = i % 2 === 0 ? r : inner
    const angle = (i * Math.PI) / puntas - Math.PI / 2
    const x = cx + Math.cos(angle) * radio
    const y = cy + Math.sin(angle) * radio
    i === 0 ? path.moveTo(x, y) : path.lineTo(x, y)
  }
  path.close()
  return path
}

export default function EstrellasScreen() {
  const navigation    = useNavigation()
  const [permission, requestPermission] = useCameraPermissions()
  const cameraRef     = useRef<CameraView>(null)

  const [estrellas,   setEstrellas]   = useState<Estrella[]>(() => Array.from({ length: NUM_ESTRELLAS }, crearEstrella))
  const [puntos,      setPuntos]      = useState(0)
  const [tiempo,      setTiempo]      = useState(DURACION)
  const [pausado,     setPausado]     = useState(false)
  const [jugando,     setJugando]     = useState(true)
  const [feedback,    setFeedback]    = useState(false)

  const estrellasRef = useRef(estrellas)
  estrellasRef.current = estrellas
  const jugandoRef   = useRef(jugando)
  jugandoRef.current = jugando

  // Timer
  useEffect(() => {
    if (!jugando || pausado) return
    if (tiempo <= 0) { setJugando(false); return }
    const t = setTimeout(() => setTiempo(s => s - 1), 1000)
    return () => clearTimeout(t)
  }, [tiempo, jugando, pausado])

  // Detección de poses → verificar si la muñeca toca una estrella
  const onPose = useCallback((keypoints: Keypoint[]) => {
    if (!jugandoRef.current) return

    const muñecas = [keypoints[LM.MUÑECA_IZQ], keypoints[LM.MUÑECA_DER]]
    const tocadas: number[] = []

    for (const m of muñecas) {
      if (!m || (m.score ?? 1) < 0.3) continue
      // MoveNet devuelve coords en px del frame de captura (192x192 o 256x256)
      // Normalizamos al tamaño de pantalla
      const mx = m.x / 192 * W
      const my = m.y / 192 * GAME_H + HEADER_H

      for (const est of estrellasRef.current) {
        const dist = Math.hypot(mx - est.x, my - est.y)
        if (dist < HIT_RADIO && !tocadas.includes(est.id)) {
          tocadas.push(est.id)
        }
      }
    }

    if (tocadas.length > 0) {
      setEstrellas(prev => {
        const restantes = prev.filter(e => !tocadas.includes(e.id))
        const nuevas    = Array.from({ length: tocadas.length }, crearEstrella)
        return [...restantes, ...nuevas]
      })
      setPuntos(p => p + tocadas.length)
      setFeedback(true)
      setTimeout(() => setFeedback(false), 700)
    }
  }, [])

  usePoseDetection(cameraRef, onPose, jugando && !pausado)

  useEffect(() => {
    if (!permission?.granted) requestPermission()
  }, [])

  const formatTiempo = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0')
    const seg = (s % 60).toString().padStart(2, '0')
    return `${m}:${seg}`
  }

  if (!permission?.granted) {
    return (
      <View style={s.center}>
        <Text style={s.permText}>Se necesita acceso a la cámara</Text>
        <TouchableOpacity style={s.permBtn} onPress={requestPermission}>
          <Text style={s.permBtnText}>Dar permiso</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={s.root}>
      {/* Header */}
      <SafeAreaView>
        <View style={s.header}>
          <View style={s.logoRow}>
            <Text style={s.logoK}>K</Text>
            <Text style={s.logoRest}>inetix</Text>
            <Text style={s.gameLabel}> — Estrellas</Text>
          </View>
          <View style={s.headerBtns}>
            <TouchableOpacity style={s.btnSmall} onPress={() => setPausado(p => !p)}>
              <Text style={s.btnSmallText}>{pausado ? '▶' : '⏸'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.btnSmall, s.btnBlue]} onPress={() => navigation.goBack()}>
              <Text style={s.btnSmallText}>↩</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      {/* Juego */}
      <View style={s.gameArea}>
        {/* Cámara de fondo (espejo) */}
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          facing="front"
        />

        {/* Canvas de estrellas encima */}
        <Canvas style={StyleSheet.absoluteFill}>
          {estrellas.map(est => {
            const starPath = dibujarEstrella(est.x, est.y - HEADER_H, RADIO)
            return (
              <Group key={est.id}>
                {/* Halo */}
                <Circle cx={est.x} cy={est.y - HEADER_H} r={RADIO + 18} color="rgba(250,204,21,0.18)" />
                {/* Estrella */}
                <Path path={starPath} color="#facc15" />
                {/* Centro blanco */}
                <Circle cx={est.x} cy={est.y - HEADER_H} r={RADIO * 0.28} color="rgba(255,255,255,0.7)" />
              </Group>
            )
          })}
        </Canvas>

        {/* HUD superpuesto */}
        <View style={s.hud} pointerEvents="none">
          <View style={s.pill}><Text style={s.pillText}>⭐ {puntos}</Text></View>
          <View style={s.pill}><Text style={s.pillText}>⏱ {formatTiempo(tiempo)}</Text></View>
        </View>

        {/* Feedback "¡Bien!" */}
        {feedback && (
          <View style={s.feedbackBanner} pointerEvents="none">
            <Text style={s.feedbackText}>⭐ ¡Bien!</Text>
          </View>
        )}

        {/* Pantalla fin */}
        {!jugando && (
          <View style={s.finOverlay}>
            <Text style={s.finTitle}>¡Tiempo!</Text>
            <Text style={s.finStat}>⭐ {puntos} estrellas</Text>
            <TouchableOpacity style={s.finBtn} onPress={() => navigation.goBack()}>
              <Text style={s.finBtnText}>Volver</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  root:          { flex: 1, backgroundColor: '#0a0a1a' },
  gameArea:      { flex: 1, position: 'relative' },
  center:        { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  header:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 10, backgroundColor: '#dde3f0', height: HEADER_H },
  logoRow:       { flexDirection: 'row', alignItems: 'baseline' },
  logoK:         { fontSize: 20, fontWeight: '900', color: colors.accent },
  logoRest:      { fontSize: 18, fontWeight: '800', color: colors.primary },
  gameLabel:     { fontSize: 12, color: '#555', fontWeight: '600' },
  headerBtns:    { flexDirection: 'row', gap: 6 },
  btnSmall:      { backgroundColor: colors.accent, borderRadius: radius.full, paddingHorizontal: 14, paddingVertical: 7 },
  btnBlue:       { backgroundColor: colors.primary },
  btnSmallText:  { color: '#fff', fontSize: 14, fontWeight: '700' },
  hud:           { position: 'absolute', top: 12, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 10 },
  pill:          { backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 },
  pillText:      { fontSize: 14, fontWeight: '700', color: colors.text },
  feedbackBanner:{ position: 'absolute', top: '20%', left: 0, right: 0, alignItems: 'center' },
  feedbackText:  { fontSize: 46, fontWeight: '900', color: '#facc15', textShadow: '0 2px 12px rgba(0,0,0,0.4)' } as any,
  finOverlay:    { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center', gap: 20 },
  finTitle:      { fontSize: 56, fontWeight: '900', color: '#fff' },
  finStat:       { fontSize: 36, fontWeight: '700', color: '#facc15' },
  finBtn:        { backgroundColor: colors.primary, borderRadius: radius.full, paddingHorizontal: 32, paddingVertical: 14 },
  finBtnText:    { color: '#fff', fontSize: 18, fontWeight: '700' },
  permText:      { fontSize: 16, color: colors.text, marginBottom: 16 },
  permBtn:       { backgroundColor: colors.accent, borderRadius: radius.full, paddingHorizontal: 24, paddingVertical: 12 },
  permBtnText:   { color: '#fff', fontSize: 15, fontWeight: '700' },
})
