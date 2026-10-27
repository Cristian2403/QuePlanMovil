import { useEffect, useState } from 'react'
import { View, StyleSheet, TouchableOpacity, Text, Alert, TextInput, Modal, FlatList } from 'react-native'
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

type FiltroTipo = 'nombre' | 'categoria' | 'presupuesto'

export default function HomeScreen() {
  const [lugares, setLugares] = useState<Lugar[]>([])
  const [lugarSeleccionado, setLugarSeleccionado] = useState<Lugar | null>(null)
  const [busqueda, setBusqueda] = useState<string>('')
  const [filtroActivo, setFiltroActivo] = useState<FiltroTipo>('nombre')
  const [modalVisible, setModalVisible] = useState<boolean>(false)
  const [lugaresFiltradosPorPresupuesto, setLugaresFiltradosPorPresupuesto] = useState<number[]>([])

  const obtenerLugares = async () => {
    const { data, error } = await supabase
      .from('lugares')
      .select('*')

    if (!error && data) {
      setLugares(data)
    }
  }

  const filtrarPorPresupuesto = async (presupuesto: string) => {
    if (!presupuesto) {
      setLugaresFiltradosPorPresupuesto([])
      return
    }

    const { data, error } = await supabase
      .from('servicios')
      .select('id_lugar')
      .lte('precio', parseFloat(presupuesto))

    if (!error && data) {
      const ids = [...new Set(data.map((s) => s.id_lugar))]
      setLugaresFiltradosPorPresupuesto(ids)
    }
  }

  const lugaresFiltrados = lugares.filter((lugar) => {
    if (!busqueda) return true

    if (filtroActivo === 'nombre') {
      return lugar.nombre.toLowerCase().includes(busqueda.toLowerCase())
    }

    if (filtroActivo === 'categoria') {
      return lugar.categoria.toLowerCase().includes(busqueda.toLowerCase())
    }

    if (filtroActivo === 'presupuesto') {
      return lugaresFiltradosPorPresupuesto.includes(lugar.id_lugar)
    }

    return true
  })

  const handleBusquedaChange = (texto: string) => {
    setBusqueda(texto)
    if (filtroActivo === 'presupuesto') {
      filtrarPorPresupuesto(texto)
    }
  }

  const seleccionarFiltro = (filtro: FiltroTipo) => {
    setFiltroActivo(filtro)
    setBusqueda('')
    setLugaresFiltradosPorPresupuesto([])
    setModalVisible(false)
  }

  const handleMarkerPress = (lugar: Lugar) => {
    setLugarSeleccionado(lugar)
  }

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      Alert.alert('Error', error.message)
    }
  }

  const getPlaceholder = () => {
    if (filtroActivo === 'nombre') return 'Buscar por nombre...'
    if (filtroActivo === 'categoria') return 'Buscar por categoría...'
    if (filtroActivo === 'presupuesto') return 'Ingresa tu presupuesto...'
    return 'Buscar...'
  }

  const getFiltroLabel = () => {
    if (filtroActivo === 'nombre') return '🔤 Nombre'
    if (filtroActivo === 'categoria') return '🏷️ Categoría'
    if (filtroActivo === 'presupuesto') return '💰 Presupuesto'
    return 'Filtros'
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

      {/* Barra de búsqueda y filtros */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder={getPlaceholder()}
          placeholderTextColor="#A0A0A0"
          value={busqueda}
          onChangeText={handleBusquedaChange}
          keyboardType={filtroActivo === 'presupuesto' ? 'decimal-pad' : 'default'}
        />
        <TouchableOpacity
          style={styles.filtroBoton}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.filtroBotonTexto}>{getFiltroLabel()}</Text>
        </TouchableOpacity>
      </View>

      {/* Modal de filtros */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitulo}>Filtrar por</Text>

            {[
              { key: 'nombre', label: '🔤 Nombre' },
              { key: 'categoria', label: '🏷️ Categoría' },
              { key: 'presupuesto', label: '💰 Presupuesto' },
            ].map((opcion) => (
              <TouchableOpacity
                key={opcion.key}
                style={[
                  styles.opcionFiltro,
                  filtroActivo === opcion.key && styles.opcionFiltroActiva
                ]}
                onPress={() => seleccionarFiltro(opcion.key as FiltroTipo)}
              >
                <Text style={[
                  styles.opcionFiltroTexto,
                  filtroActivo === opcion.key && styles.opcionFiltroTextoActivo
                ]}>
                  {opcion.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

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
    flexDirection: 'row',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#1E1E1E',
    color: '#FFFFFF',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    elevation: 5,
  },
  filtroBoton: {
    backgroundColor: '#4A90E2',
    borderRadius: 8,
    padding: 14,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  filtroBotonTexto: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#1E1E1E',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitulo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  opcionFiltro: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#121212',
  },
  opcionFiltroActiva: {
    backgroundColor: '#4A90E2',
  },
  opcionFiltroTexto: {
    fontSize: 16,
    color: '#A0A0A0',
  },
  opcionFiltroTextoActivo: {
    color: '#FFFFFF',
    fontWeight: 'bold',
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