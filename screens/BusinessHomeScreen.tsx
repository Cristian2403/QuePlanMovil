import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native'
import { supabase } from '../lib/supabase'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RootStackParamList } from '../navigation/AppNavigator'

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'BusinessHome'>
}

type Lugar = {
  id_lugar: number
  nombre: string
  descripcion: string
  categoria: string
}

export default function BusinessHomeScreen({ navigation }: Props) {
  const [lugares, setLugares] = useState<Lugar[]>([])

  const obtenerLugares = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: negocio } = await supabase
      .from('negocios')
      .select('id_negocio')
      .eq('id_usuario', user.id)
      .single()

    if (!negocio) return

    const { data, error } = await supabase
      .from('lugares')
      .select('*')
      .eq('id_negocio', negocio.id_negocio)

    if (!error && data) {
      setLugares(data)
    }
  }

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) Alert.alert('Error', error.message)
  }

  useEffect(() => {
    obtenerLugares()
  }, [])

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mis lugares</Text>

      {lugares.length === 0 ? (
        <Text style={styles.empty}>No tienes lugares registrados aún</Text>
      ) : (
        <FlatList
          data={lugares}
          keyExtractor={(item) => item.id_lugar.toString()}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.nombre}>{item.nombre}</Text>
              <Text style={styles.info}>{item.categoria}</Text>
              <Text style={styles.info}>{item.descripcion}</Text>
            </View>
          )}
        />
      )}

      <TouchableOpacity
        style={styles.botonAgregar}
        onPress={() => navigation.navigate('AddPlace')}
      >
        <Text style={styles.botonTexto}>+ Agregar lugar</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.botonCerrar} onPress={handleLogout}>
        <Text style={styles.botonTexto}>Cerrar sesión</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 24,
  },
  empty: {
    color: '#A0A0A0',
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
  },
  card: {
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  nombre: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  info: {
    fontSize: 14,
    color: '#A0A0A0',
    marginBottom: 2,
  },
  botonAgregar: {
    backgroundColor: '#4A90E2',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  botonCerrar: {
    backgroundColor: '#E74C3C',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 32,
  },
  botonTexto: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
})