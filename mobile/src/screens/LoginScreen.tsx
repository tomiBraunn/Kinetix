import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native'
import { useState } from 'react'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RootStackParamList } from '../navigation/AppNavigator'
import { colors, radius, shadow } from '../lib/theme'

type Nav = NativeStackNavigationProp<RootStackParamList, 'Login'>

export default function LoginScreen() {
  const navigation = useNavigation<Nav>()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  async function handleLogin() {
    if (!email || !password) { setError('Completá todos los campos'); return }
    setLoading(true)
    setError('')
    try {
      // TODO: conectar con el mismo backend /api/auth/login
      // const res = await fetch('http://YOUR_BACKEND/api/auth/login', { method: 'POST', ... })
      navigation.replace('Home')
    } catch {
      setError('Credenciales incorrectas')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={s.card}>
        {/* Logo */}
        <View style={s.logoRow}>
          <Text style={s.logoK}>K</Text>
          <Text style={s.logoRest}>inetix</Text>
        </View>
        <Text style={s.subtitle}>Rehabilitación interactiva</Text>

        {/* Inputs */}
        <TextInput
          style={s.input}
          placeholder="Email"
          placeholderTextColor={colors.textMuted}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={s.input}
          placeholder="Contraseña"
          placeholderTextColor={colors.textMuted}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {!!error && <Text style={s.error}>{error}</Text>}

        <TouchableOpacity style={s.btn} onPress={handleLogin} disabled={loading} activeOpacity={0.85}>
          <Text style={s.btnText}>{loading ? 'Entrando...' : 'Iniciar sesión'}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  root:     { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', padding: 24 },
  card:     { width: '100%', maxWidth: 380, backgroundColor: colors.surface, borderRadius: radius.lg, padding: 32, ...shadow.md },
  logoRow:  { flexDirection: 'row', alignItems: 'baseline', marginBottom: 4 },
  logoK:    { fontSize: 40, fontWeight: '900', color: colors.accent },
  logoRest: { fontSize: 36, fontWeight: '800', color: colors.primary, marginLeft: 1 },
  subtitle: { fontSize: 14, color: colors.textMuted, marginBottom: 28 },
  input:    { borderWidth: 1.5, borderColor: '#dde3f0', borderRadius: radius.md, padding: 14, fontSize: 15, color: colors.text, marginBottom: 14 },
  error:    { color: colors.danger, fontSize: 13, marginBottom: 10 },
  btn:      { backgroundColor: colors.accent, borderRadius: radius.full, paddingVertical: 15, alignItems: 'center', marginTop: 6 },
  btnText:  { color: '#fff', fontSize: 16, fontWeight: '700' },
})
