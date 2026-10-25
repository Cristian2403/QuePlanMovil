import { useEffect, useState } from 'react'
import { View, StyleSheet, TouchableOpacity, Text, Alert, TextInput } from 'react-native'
import MapView, { Marker } from 'react-native-maps'
import { supabase } from '../lib/supabase'
import PlaceBottomSheet from '../components/PlaceBottomSheet'

type Lugar = {
  id_lugar: number
  nombre: string
  descripcion: string
  categoria: string
  latitud: number
  longitud: number
  imagen: string | null
}

export default function HomeScreen() {
  const [lugares, setLugares] = useState<Lugar[]>([])
  const [lugarSeleccionado, setLugarSeleccionado] = useState<Lugar | null>(null)
  const [busqueda, setBusqueda] = useState<string>('')

  const obtenerLugares = async () => {
    const { data, error } = await supabase
      .from('lugares')
      .select('*')

    if (!error && data) {
      setLugares(data)
    }
  }

  const lugaresFiltrados = lugares.filter((lugar) =>
    lugar.nombre.toLowerCase().includes(busqueda.toLowerCase())
  )

  const handleMarkerPress = (lugar: Lugar) => {
    setLugarSeleccionado(lugar)
  }

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      Alert.alert('Error', error.message)
    }
  }

  useEffect(() => {
    obtenerLugares()
  }, [])

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: 6.2442,
          longitude: -75.5812,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        {lugaresFiltrados.map((lugar) => (
          <Marker
            key={lugar.id_lugar}
            coordinate={{
              latitude: lugar.latitud,
              longitude: lugar.longitud,
            }}
            title={lugar.nombre}
            onPress={() => handleMarkerPress(lugar)}
          />
        ))}
      </MapView>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar lugares..."
          placeholderTextColor="#A0A0A0"
          value={busqueda}
          onChangeText={setBusqueda}
        />
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Cerrar sesión</Text>
      </TouchableOpacity>

      <PlaceBottomSheet
        lugar={lugarSeleccionado}
        onClose={() => setLugarSeleccionado(null)}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  searchContainer: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
  },
  searchInput: {
    backgroundColor: '#1E1E1E',
    color: '#FFFFFF',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  logoutButton: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    backgroundColor: '#E74C3C',
    borderRadius: 8,
    padding: 12,
  },
  logoutText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
})