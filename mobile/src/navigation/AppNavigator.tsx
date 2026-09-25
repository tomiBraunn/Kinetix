import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import LoginScreen      from '../screens/LoginScreen'
import HomeScreen       from '../screens/HomeScreen'
import SeleccionJuego   from '../screens/SeleccionJuego'
import GameScreen       from '../screens/games/GameScreen'

export type RootStackParamList = {
  Login:      undefined
  Home:       undefined
  Juegos:     { pacienteId?: string } | undefined
  Estrellas:  { pacienteId?: string } | undefined
  Flamenco:   { pacienteId?: string } | undefined
}

const Stack = createNativeStackNavigator<RootStackParamList>()

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login"     component={LoginScreen} />
        <Stack.Screen name="Home"      component={HomeScreen} />
        <Stack.Screen name="Juegos"    component={SeleccionJuego} />
        <Stack.Screen name="Estrellas" component={GameScreen} />
        <Stack.Screen name="Flamenco"  component={GameScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  )
}
