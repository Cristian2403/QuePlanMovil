import { useEffect, useRef, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Image
} from 'react-native'
import { supabase } from '../lib/supabase'

const { height } = Dimensions.get('window')

type Lugar = {
  id_lugar: number
  nombre: string
  descripcion: string
  categoria: string
  latitud: number
  longitud: number
  imagen: string | null
}

type Servicio = {
  id_servicio: number
  nombre: string
  precio: number
}

type Props = {
  lugar: Lugar | null
  onClose: () => void
}

export default function PlaceBottomSheet({ lugar, onClose }: Props) {
  const translateY = useRef(new Animated.Value(height)).current
  const [servicios, setServicios] = useState<Servicio[]>([])

  const obtenerServicios = async (idLugar: number) => {
    const { data, error } = await supabase
      .from('servicios')
      .select('*')
      .eq('id_lugar', idLugar)

    if (!error && data) {
      setServicios(data)
    }
  }

  useEffect(() => {
    if (lugar) {
      obtenerServicios(lugar.id_lugar)
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
      }).start()
    } else {
      setServicios([])
      Animated.spring(translateY, {
        toValue: height,
        useNativeDriver: true,
      }).start()
    }
  }, [lugar])

  if (!lugar) return null

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY }] }]}>
      <View style={styles.handle} />

      <TouchableOpacity style={styles.cerrar} onPress={onClose}>
        <Text style={styles.cerrarTexto}>✕</Text>
      </TouchableOpacity>

      <ScrollView showsVerticalScrollIndicator={false}>

        {lugar.imagen && (
          <Image
            source={{ uri: lugar.imagen }}
            style={styles.imagen}
            resizeMode="cover"
          />
        )}

        <Text style={styles.categoria}>{lugar.categoria}</Text>
        <Text style={styles.nombre}>{lugar.nombre}</Text>
        <Text style={styles.descripcion}>{lugar.descripcion}</Text>

        {servicios.length > 0 && (
          <>
            <Text style={styles.serviciosTitulo}>Servicios</Text>
            {servicios.map((servicio) => (
              <View key={servicio.id_servicio} style={styles.servicioCard}>
                <Text style={styles.servicioNombre}>{servicio.nombre}</Text>
                <Text style={styles.servicioPrecio}>
                  ${servicio.precio.toLocaleString('es-CO')}
                </Text>
              </View>
            ))}
          </>
        )}

      </ScrollView>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '70%',
    backgroundColor: '#1E1E1E',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#A0A0A0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  cerrar: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  cerrarTexto: {
    color: '#A0A0A0',
    fontSize: 18,
  },
  imagen: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
  },
  categoria: {
    fontSize: 12,
    color: '#4A90E2',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  nombre: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  descripcion: {
    fontSize: 16,
    color: '#A0A0A0',
    lineHeight: 24,
    marginBottom: 24,
  },
  serviciosTitulo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  servicioCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#121212',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  servicioNombre: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  servicioPrecio: {
    fontSize: 16,
    color: '#2ECC71',
    fontWeight: 'bold',
  },
})