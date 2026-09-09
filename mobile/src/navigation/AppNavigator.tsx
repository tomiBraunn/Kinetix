import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import LoginScreen      from '../screens/LoginScreen'
import HomeScreen       from '../screens/HomeScreen'
import SeleccionJuego   from '../screens/SeleccionJuego'
import EstrellasScreen  from '../screens/games/EstrellasScreen'
import FlamencoScreen   from '../screens/games/FlamencoScreen'

export type RootStackParamList = {
  Login:      undefined
  Home:       undefined
  Juegos:     { pacienteId?: string }
  Estrellas:  { pacienteId?: string }
  Flamenco:   { pacienteId?: string }
}

const Stack = createNativeStackNavigator<RootStackParamList>()

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login"     component={LoginScreen} />
        <Stack.Screen name="Home"      component={HomeScreen} />
        <Stack.Screen name="Juegos"    component={SeleccionJuego} />
        <Stack.Screen name="Estrellas" component={EstrellasScreen} />
        <Stack.Screen name="Flamenco"  component={FlamencoScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  )
}
