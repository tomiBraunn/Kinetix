import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RootStackParamList } from '../navigation/AppNavigator'
import { colors, radius, shadow } from '../lib/theme'

type Nav = NativeStackNavigationProp<RootStackParamList, 'Home'>

const JUEGOS = [
  { id: 'Estrellas', label: 'Alcanzá la Estrella', emoji: '⭐', desc: 'Estirá los brazos y tocá las estrellas' },
  { id: 'Flamenco',  label: 'Flamenco Challenge',  emoji: '💃', desc: 'Levantá la pierna y mantené el equilibrio' },
]

export default function HomeScreen() {
  const navigation = useNavigation<Nav>()

  return (
    <SafeAreaView style={s.root}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.logoRow}>
          <Text style={s.logoK}>K</Text>
          <Text style={s.logoRest}>inetix</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.replace('Login')}>
          <Text style={s.logout}>Salir</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.sectionTitle}>Juegos disponibles</Text>

        {JUEGOS.map(j => (
          <TouchableOpacity
            key={j.id}
            style={s.card}
            activeOpacity={0.85}
            onPress={() => navigation.navigate(j.id as any)}
          >
            <Text style={s.cardEmoji}>{j.emoji}</Text>
            <View style={s.cardText}>
              <Text style={s.cardTitle}>{j.label}</Text>
              <Text style={s.cardDesc}>{j.desc}</Text>
            </View>
            <Text style={s.arrow}>›</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  root:        { flex: 1, backgroundColor: colors.bg },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: colors.surface, ...shadow.sm },
  logoRow:     { flexDirection: 'row', alignItems: 'baseline' },
  logoK:       { fontSize: 26, fontWeight: '900', color: colors.accent },
  logoRest:    { fontSize: 22, fontWeight: '800', color: colors.primary },
  logout:      { fontSize: 14, color: colors.textMuted, fontWeight: '600' },
  content:     { padding: 20, gap: 16 },
  sectionTitle:{ fontSize: 18, fontWeight: '800', color: colors.text, marginBottom: 4 },
  card:        { backgroundColor: colors.surface, borderRadius: radius.lg, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 14, ...shadow.sm },
  cardEmoji:   { fontSize: 36 },
  cardText:    { flex: 1 },
  cardTitle:   { fontSize: 16, fontWeight: '700', color: colors.text },
  cardDesc:    { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  arrow:       { fontSize: 28, color: colors.textMuted },
})
