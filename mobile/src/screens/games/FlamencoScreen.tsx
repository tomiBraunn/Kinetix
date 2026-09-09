import { useRef, useState, useEffect, useCallback } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Dimensions } from 'react-native'
import { CameraView, useCameraPermissions } from 'expo-camera'
import { Canvas, Circle, RoundedRect, Group } from '@shopify/react-native-skia'
import { useNavigation } from '@react-navigation/native'
import { usePoseDetection, LM, type Keypoint } from '../../ia/usePoseDetection'
import { colors, radius } from '../../lib/theme'

const { width: W, height: H } = Dimensions.get('window')
const HEADER_H  = 56
const GAME_H    = H - HEADER_H
const DURACION  = 60
const FRAMES_REQUERIDOS = 3   // frames consecutivos para confirmar postura

export default function FlamencoScreen() {
  const navigation = useNavigation()
  const [permission, requestPermission] = useCameraPermissions()
  const cameraRef  = useRef<CameraView>(null)

  const [piernaArriba, setPiernaArriba] = useState(false)
  const [timerActual,  setTimerActual]  = useState(0)
  const [mejorTiempo,  setMejorTiempo]  = useState(0)
  const [intentos,     setIntentos]     = useState(0)
  const [tiempoSesion, setTiempoSesion] = useState(DURACION)
  const [pausado,      setPausado]      = useState(false)
  const [jugando,      setJugando]      = useState(true)

  const stateRef = useRef({ piernaArriba: false, timerActual: 0, mejorTiempo: 0, cnt: 0 })
  const jugandoRef = useRef(true)
  jugandoRef.current = jugando

  // Cronómetro de sesión
  useEffect(() => {
    if (!jugando || pausado) return
    if (tiempoSesion <= 0) { setJugando(false); return }
    const t = setTimeout(() => setTiempoSesion(s => s - 1), 1000)
    return () => clearTimeout(t)
  }, [tiempoSesion, jugando, pausado])

  // Cronómetro de equilibrio (cada 100ms cuando pierna arriba)
  useEffect(() => {
    if (!jugando || pausado || !piernaArriba) return
    const t = setInterval(() => {
      setTimerActual(s => {
        const n = parseFloat((s + 0.1).toFixed(1))
        stateRef.current.timerActual = n
        return n
      })
    }, 100)
    return () => clearInterval(t)
  }, [jugando, pausado, piernaArriba])

  const onPose = useCallback((keypoints: Keypoint[]) => {
    if (!jugandoRef.current) return

    const rIzq = keypoints[LM.RODILLA_IZQ]
    const rDer = keypoints[LM.RODILLA_DER]
    const cIzq = keypoints[LM.CADERA_IZQ]
    const cDer = keypoints[LM.CADERA_DER]

    if (!rIzq || !rDer || !cIzq || !cDer) return

    const visOk = (kp: Keypoint) => (kp.score ?? 1) > 0.35
    if (!visOk(rIzq) || !visOk(rDer) || !visOk(cIzq) || !visOk(cDer)) return

    // MoveNet da coords en px del input tensor (192x192)
    // Comparo relaciones de Y (arriba = menor Y)
    const frameH = 192
    const rIzqNorm = rIzq.y / frameH
    const rDerNorm = rDer.y / frameH
    const cIzqNorm = cIzq.y / frameH
    const cDerNorm = cDer.y / frameH

    const levantada =
      rDerNorm < cIzqNorm - 0.04 ||   // rodilla derecha sobre cadera izquierda
      rIzqNorm < cDerNorm - 0.04       // rodilla izquierda sobre cadera derecha

    const prev = stateRef.current.piernaArriba

    if (levantada === prev) {
      stateRef.current.cnt = 0
    } else {
      stateRef.current.cnt++
      if (stateRef.current.cnt >= FRAMES_REQUERIDOS) {
        stateRef.current.cnt = 0
        stateRef.current.piernaArriba = levantada
        setPiernaArriba(levantada)

        if (!levantada) {
          // Pierna bajó → actualizar mejor tiempo
          const t = stateRef.current.timerActual
          if (t > stateRef.current.mejorTiempo) {
            stateRef.current.mejorTiempo = t
            setMejorTiempo(t)
          }
          stateRef.current.timerActual = 0
          setTimerActual(0)
        } else {
          setIntentos(i => i + 1)
        }
      }
    }
  }, [])

  usePoseDetection(cameraRef, onPose, jugando && !pausado)

  useEffect(() => {
    if (!permission?.granted) requestPermission()
  }, [])

  const formatTiempo = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`

  const indicadorCx = W / 2
  const indicadorCy = GAME_H * 0.74
  const indicadorR  = 62

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
      <SafeAreaView>
        <View style={s.header}>
          <View style={s.logoRow}>
            <Text style={s.logoK}>K</Text>
            <Text style={s.logoRest}>inetix</Text>
            <Text style={s.gameLabel}> — Flamenco</Text>
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

      <View style={s.gameArea}>
        <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="front" />

        {/* Indicador circular en el canvas */}
        <Canvas style={StyleSheet.absoluteFill}>
          <Group>
            {piernaArriba ? (
              <>
                <Circle cx={indicadorCx} cy={indicadorCy} r={indicadorR + 28} color="rgba(255,95,170,0.18)" />
                <Circle cx={indicadorCx} cy={indicadorCy} r={indicadorR + 14} color="rgba(255,95,170,0.35)" />
                <Circle cx={indicadorCx} cy={indicadorCy} r={indicadorR}      color="#ff5faa" />
                {/* Silueta pierna levantada */}
                <RoundedRect x={indicadorCx - 11} y={indicadorCy - 40} width={22} height={54} r={8} color="white" />
                <RoundedRect x={indicadorCx - 22} y={indicadorCy - 8}  width={44} height={14} r={5} color="white" />
              </>
            ) : (
              <>
                <Circle cx={indicadorCx} cy={indicadorCy} r={indicadorR} color="rgba(51,68,85,0.75)" />
                <RoundedRect x={indicadorCx - 18} y={indicadorCy - 11} width={36} height={22} r={6} color="#7788aa" />
              </>
            )}
          </Group>
        </Canvas>

        {/* HUD */}
        <View style={s.hud} pointerEvents="none">
          <View style={s.pill}><Text style={s.pillText}>⏱ {formatTiempo(tiempoSesion)}</Text></View>
          <View style={[s.pill, piernaArriba && s.pillGreen]}>
            <Text style={[s.pillText, piernaArriba && s.pillTextGreen]}>
              🦵 {piernaArriba ? `${timerActual.toFixed(1)}s` : 'Levantá la pierna'}
            </Text>
          </View>
          <View style={s.pill}><Text style={s.pillText}>🏆 {mejorTiempo.toFixed(1)}s</Text></View>
        </View>

        {/* Intentos */}
        <View style={s.intentosBadge} pointerEvents="none">
          <Text style={s.intentosText}>Intentos: {intentos}</Text>
        </View>

        {/* Pantalla fin */}
        {!jugando && (
          <View style={s.finOverlay}>
            <Text style={s.finTitle}>¡Tiempo!</Text>
            <Text style={s.finStat}>Mejor: {mejorTiempo.toFixed(1)}s</Text>
            <Text style={s.finStat2}>Intentos: {intentos}</Text>
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
  root:          { flex: 1, backgroundColor: '#1a1a2e' },
  gameArea:      { flex: 1 },
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
  hud:           { position: 'absolute', top: 12, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 8, flexWrap: 'wrap' },
  pill:          { backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  pillGreen:     { backgroundColor: 'rgba(34,197,94,0.92)' },
  pillText:      { fontSize: 13, fontWeight: '700', color: colors.text },
  pillTextGreen: { color: '#052e16' },
  intentosBadge: { position: 'absolute', bottom: 16, right: 16, backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6 },
  intentosText:  { fontSize: 13, fontWeight: '600', color: colors.text },
  finOverlay:    { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.72)', alignItems: 'center', justifyContent: 'center', gap: 18 },
  finTitle:      { fontSize: 56, fontWeight: '900', color: '#fff' },
  finStat:       { fontSize: 36, fontWeight: '700', color: '#facc15' },
  finStat2:      { fontSize: 24, fontWeight: '600', color: '#fff' },
  finBtn:        { backgroundColor: colors.primary, borderRadius: radius.full, paddingHorizontal: 32, paddingVertical: 14, marginTop: 8 },
  finBtnText:    { color: '#fff', fontSize: 18, fontWeight: '700' },
  permText:      { fontSize: 16, color: colors.text, marginBottom: 16 },
  permBtn:       { backgroundColor: colors.accent, borderRadius: radius.full, paddingHorizontal: 24, paddingVertical: 12 },
  permBtnText:   { color: '#fff', fontSize: 15, fontWeight: '700' },
})
