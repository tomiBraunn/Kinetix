import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import WebAppScreen from './src/screens/WebAppScreen'

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <WebAppScreen />
    </SafeAreaProvider>
  )
}
