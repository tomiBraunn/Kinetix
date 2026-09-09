import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RootStackParamList } from '../navigation/AppNavigator'
import { colors, radius, shadow } from '../lib/theme'

type Nav = NativeStackNavigationProp<RootStackParamList>

const JUEGOS = [
  {
    id: 'Estrellas' as const,
    label: 'Alcanzá la Estrella',
    emoji: '⭐',
    desc: 'Estirá los brazos y tocá las estrellas con tus manos',
    color: '#facc15',
    bg: '#fefce8',
  },
  {
    id: 'Flamenco' as const,
    label: 'Flamenco Challenge',
    emoji: '💃',
    desc: 'Levantá una pierna y mantené el equilibrio',
    color: '#f472b6',
    bg: '#fdf2f8',
  },
]

export default function SeleccionJuego() {
  const navigation = useNavigation<Nav>()

  return (
    <SafeAreaView style={s.root}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={s.back}>‹ Volver</Text>
        </TouchableOpacity>
        <Text style={s.title}>Elegí un juego</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={s.content}>
        {JUEGOS.map(j => (
          <TouchableOpacity
            key={j.id}
            style={[s.card, { backgroundColor: j.bg }]}
            activeOpacity={0.88}
            onPress={() => navigation.navigate(j.id)}
          >
            <Text style={s.emoji}>{j.emoji}</Text>
            <View style={s.cardText}>
              <Text style={[s.cardTitle, { color: j.color === '#facc15' ? '#92400e' : '#831843' }]}>{j.label}</Text>
              <Text style={s.cardDesc}>{j.desc}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  root:      { flex: 1, backgroundColor: colors.bg },
  header:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16 },
  back:      { fontSize: 17, color: colors.primary, fontWeight: '600' },
  title:     { fontSize: 18, fontWeight: '800', color: colors.text },
  content:   { flex: 1, padding: 20, gap: 16 },
  card:      { borderRadius: radius.lg, padding: 24, flexDirection: 'row', alignItems: 'center', gap: 16, ...shadow.sm },
  emoji:     { fontSize: 48 },
  cardText:  { flex: 1 },
  cardTitle: { fontSize: 18, fontWeight: '800', marginBottom: 4 },
  cardDesc:  { fontSize: 14, color: colors.textMuted, lineHeight: 20 },
})
