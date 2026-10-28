import { useEffect, useRef } from 'react'
import { View, Text, StyleSheet, Animated, TouchableOpacity, ScrollView, Dimensions, Image, Alert, TextInput } from 'react-native'
import { supabase } from '../lib/supabase'
import { useState } from 'react'
import { Linking } from 'react-native'
import * as Location from 'expo-location'

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
  onAgregarPlan: (lugar: any) => boolean
  onQuitarPlan: (idLugar: number) => void
  estaEnPlan: (idLugar: number) => boolean
}

export default function PlaceBottomSheet({ lugar, onClose, onAgregarPlan, onQuitarPlan, estaEnPlan }: Props) {
  const translateY = useRef(new Animated.Value(height)).current
  const [servicios, setServicios] = useState<Servicio[]>([])
  const [resenas, setResenas] = useState<any[]>([])
  const [comentario, setComentario] = useState<string>('')
  const [calificacion, setCalificacion] = useState<number>(0)
  const [enviando, setEnviando] = useState<boolean>(false)
  const [resenaUsuario, setResenaUsuario] = useState<any | null>(null)
  const [editando, setEditando] = useState<boolean>(false)
  const [usuarioId, setUsuarioId] = useState<string | null>(null)

  const obtenerUsuario = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) setUsuarioId(user.id)
  }

  const obtenerServicios = async (idLugar: number) => {
    const { data, error } = await supabase
      .from('servicios')
      .select('*')
      .eq('id_lugar', idLugar)

    if (!error && data) setServicios(data)
  }


  const obtenerResenas = async (idLugar: number) => {
    const { data: { user } } = await supabase.auth.getUser()

    const { data, error } = await supabase
      .from('resenas')
      .select('*, usuarios(nombre)')
      .eq('id_lugar', idLugar)
      .order('fecha', { ascending: false })

    if (!error && data) {
      setResenas(data)
      const mia = data.find(r => r.id_usuario === user?.id)
      setResenaUsuario(mia ?? null)
      if (mia) {
        setComentario(mia.comentario)
        setCalificacion(mia.calificacion)
      }
    }
  }


  const eliminarResena = async () => {
    Alert.alert('Eliminar reseña', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase
            .from('resenas')
            .delete()
            .eq('id_resena', resenaUsuario.id_resena)

          if (!error) {
            setResenaUsuario(null)
            setComentario('')
            setCalificacion(0)
            setEditando(false)
            obtenerResenas(lugar!.id_lugar)
          }
        }
      }
    ])
  }

  const editarResena = async () => {
    if (!comentario || calificacion === 0) {
      Alert.alert('Error', 'Por favor completa todos los campos')
      return
    }

    setEnviando(true)

    const { error } = await supabase
      .from('resenas')
      .update({ comentario, calificacion })
      .eq('id_resena', resenaUsuario.id_resena)

    if (!error) {
      setEditando(false)
      obtenerResenas(lugar!.id_lugar)
    }

    setEnviando(false)
  }



  const enviarResena = async () => {
    if (!comentario || calificacion === 0) {
      Alert.alert('Error', 'Por favor escribe un comentario y selecciona una calificación')
      return
    }

    setEnviando(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('resenas')
      .insert([{
        comentario,
        calificacion,
        id_usuario: user.id,
        id_lugar: lugar!.id_lugar
      }])

    if (error) {
      Alert.alert('Error', error.message)
    } else {
      setComentario('')
      setCalificacion(0)
      obtenerResenas(lugar!.id_lugar)
    }

    setEnviando(false)
  }


  const comoLlegar = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync()

    if (status !== 'granted') {
      Alert.alert('Error', 'Se necesita permiso de ubicación para mostrar la ruta')
      return
    }

    const pos = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced
    })

    const origen = `${pos.coords.latitude},${pos.coords.longitude}`
    const destino = `${lugar!.latitud},${lugar!.longitud}`
    const url = `https://www.google.com/maps/dir/?api=1&origin=${origen}&destination=${destino}&travelmode=driving`

    Linking.openURL(url)
  }

  useEffect(() => {
    if (lugar) {
      obtenerUsuario()
      obtenerServicios(lugar.id_lugar)
      obtenerResenas(lugar.id_lugar)
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true }).start()
    } else {
      setServicios([])
      setResenas([])
      setResenaUsuario(null)
      setComentario("")
      setCalificacion(0)
      setEditando(false)
      Animated.spring(translateY, { toValue: height, useNativeDriver: true }).start()
    }
  }, [lugar])

  if (!lugar) return null

  const enPlan = estaEnPlan(lugar.id_lugar)

  const handlePlan = () => {
    if (enPlan) {
      onQuitarPlan(lugar.id_lugar)
    } else {
      onAgregarPlan({
        id_lugar: lugar.id_lugar,
        nombre: lugar.nombre,
        categoria: lugar.categoria,
        latitud: lugar.latitud,
        longitud: lugar.longitud,
      })
    }
  }

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY }] }]}>
      <View style={styles.handle} />

      <TouchableOpacity style={styles.cerrar} onPress={onClose}>
        <Text style={styles.cerrarTexto}>✕</Text>
      </TouchableOpacity>

      <ScrollView showsVerticalScrollIndicator={false}>
        {lugar.imagen && (
          <Image source={{ uri: lugar.imagen }} style={styles.imagen} resizeMode="cover" />
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

        <TouchableOpacity
          style={[styles.planBtn, enPlan && styles.planBtnActivo]}
          onPress={handlePlan}
        >
          <Text style={styles.planBtnTexto}>
            {enPlan ? 'Quitar de mi plan' : 'Agregar a mi plan'}
          </Text>
        </TouchableOpacity>


        <TouchableOpacity style={styles.rutaBtn} onPress={comoLlegar}>
          <Text style={styles.rutaBtnTexto}>📍 Cómo llegar</Text>
        </TouchableOpacity>


        {/* Reseñas */}
        <View style={styles.resenasContainer}>
          <Text style={styles.resenasTitulo}>Reseñas</Text>

          {/* Formulario — solo si no ha dejado reseña o está editando */}
          {(!resenaUsuario || editando) && (
            <View style={styles.nuevaResena}>
              <Text style={styles.resenasSubtitulo}>
                {editando ? 'Editar tu reseña' : 'Deja tu reseña'}
              </Text>

              <View style={styles.estrellas}>
                {[1, 2, 3, 4, 5].map((estrella) => (
                  <TouchableOpacity
                    key={estrella}
                    onPress={() => setCalificacion(estrella)}
                  >
                    <Text style={[
                      styles.estrella,
                      estrella <= calificacion && styles.estrellaActiva
                    ]}>
                      ★
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TextInput
                style={styles.resenaInput}
                placeholder="Escribe tu comentario..."
                placeholderTextColor="#A0A0A0"
                value={comentario}
                onChangeText={setComentario}
                multiline
                numberOfLines={3}
              />

              <View style={styles.resenaAcciones}>
                <TouchableOpacity
                  onPress={editando ? editarResena : enviarResena}
                  disabled={enviando}
                >
                  <Text style={styles.resenaAccionPrincipal}>
                    {enviando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Publicar reseña'}
                  </Text>
                </TouchableOpacity>

                {editando && (
                  <TouchableOpacity onPress={() => {
                    setEditando(false)
                    setComentario(resenaUsuario.comentario)
                    setCalificacion(resenaUsuario.calificacion)
                  }}>
                    <Text style={styles.resenaAccionSecundaria}>Cancelar</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {/* Lista de reseñas */}
          {resenas.length === 0 ? (
            <Text style={styles.sinResenas}>No hay reseñas todavía</Text>
          ) : (
            resenas.map((resena) => (
              <View key={resena.id_resena} style={styles.resenaCard}>
                <View style={styles.resenaHeader}>
                  <Text style={styles.resenaUsuario}>
                    {resena.usuarios?.nombre ?? 'Usuario'}
                  </Text>
                  <Text style={styles.resenaEstrellas}>
                    {'★'.repeat(resena.calificacion)}{'☆'.repeat(5 - resena.calificacion)}
                  </Text>
                </View>
                <Text style={styles.resenaComentario}>{resena.comentario}</Text>

                {/* Opciones solo para la reseña del usuario actual */}
                {resena.id_usuario === usuarioId && (
                  <View style={styles.resenaOpciones}>
                    <TouchableOpacity onPress={() => setEditando(true)}>
                      <Text style={styles.resenaOpcionEditar}>Editar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={eliminarResena}>
                      <Text style={styles.resenaOpcionEliminar}>Eliminar</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))
          )}
        </View>


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
  planBtn: {
    backgroundColor: '#4A90E2',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  planBtnActivo: {
    backgroundColor: '#555555',
  },
  planBtnTexto: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
  resenasContainer: {
    marginTop: 24,
  },
  resenasTitulo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  resenasSubtitulo: {
    fontSize: 14,
    color: '#A0A0A0',
    marginBottom: 8,
  },
  nuevaResena: {
    backgroundColor: '#121212',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
  },
  estrellas: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  estrella: {
    fontSize: 28,
    color: '#A0A0A0',
  },
  estrellaActiva: {
    color: '#F1C40F',
  },
  resenaInput: {
    backgroundColor: '#1E1E1E',
    color: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    marginBottom: 12,
  },
  resenaBtn: {
    backgroundColor: '#4A90E2',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  resenaBtnTexto: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  sinResenas: {
    color: '#A0A0A0',
    textAlign: 'center',
    marginTop: 8,
  },
  resenaCard: {
    backgroundColor: '#121212',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  resenaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  resenaUsuario: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  resenaEstrellas: {
    color: '#F1C40F',
    fontSize: 14,
  },
  resenaComentario: {
    color: '#A0A0A0',
    fontSize: 14,
    lineHeight: 20,
  },
  resenaAcciones: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 4,
  },
  resenaAccionPrincipal: {
    color: '#4A90E2',
    fontWeight: 'bold',
    fontSize: 14,
  },
  resenaAccionSecundaria: {
    color: '#A0A0A0',
    fontSize: 14,
  },
  resenaOpciones: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  resenaOpcionEditar: {
    color: '#4A90E2',
    fontSize: 13,
  },
  resenaOpcionEliminar: {
    color: '#E74C3C',
    fontSize: 13,
  },
  rutaBtn: {
    backgroundColor: '#121212',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#4A90E2',
  },
  rutaBtnTexto: {
    color: '#4A90E2',
    fontWeight: 'bold',
    fontSize: 15,
  },
})