import { useEffect } from 'react'
import { View, Text } from 'react-native'
import { supabase } from './lib/supabase'

export default function App() {

  useEffect(() => {
    const testConnection = async () => {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')

      if (error) {
        console.log('Error de conexión:', error.message)
      } else {
        console.log('Conexión exitosa:', data)
      }
    }

    testConnection()
  }, [])

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Probando conexión con Supabase...</Text>
    </View>
  )
}