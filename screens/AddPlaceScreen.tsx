import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, Image } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { supabase } from '../lib/supabase'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RootStackParamList } from '../navigation/AppNavigator'
import * as FileSystem from 'expo-file-system/legacy'
import { decode } from 'base64-arraybuffer'

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'AddPlace'>
}

type Servicio = {
  nombre: string
  precio: string
}

export default function AddPlaceScreen({ navigation }: Props) {
  const [nombre, setNombre] = useState<string>('')
  const [descripcion, setDescripcion] = useState<string>('')
  const [categoria, setCategoria] = useState<string>('')
  const [latitud, setLatitud] = useState<string>('')
  const [longitud, setLongitud] = useState<string>('')
  const [imagen, setImagen] = useState<string | null>(null)
  const [servicios, setServicios] = useState<Servicio[]>([
    { nombre: '', precio: '' }
  ])

  const seleccionarImagen = async () => {
    const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permiso.granted) {
      Alert.alert('Error', 'Se necesita permiso para acceder a la galería')
      return
    }

    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    })

    if (!resultado.canceled) {
      setImagen(resultado.assets[0].uri)
    }
  }

  const agregarServicio = () => {
    setServicios([...servicios, { nombre: '', precio: '' }])
  }

  const actualizarServicio = (index: number, campo: string, valor: string) => {
    const nuevosServicios = [...servicios]
    nuevosServicios[index] = { ...nuevosServicios[index], [campo]: valor }
    setServicios(nuevosServicios)
  }

  const eliminarServicio = (index: number) => {
    const nuevosServicios = servicios.filter((_, i) => i !== index)
    setServicios(nuevosServicios)
  }

  const subirImagen = async (uri: string, idLugar: number): Promise<string | null> => {
    const extension = uri.split('.').pop() ?? 'jpg'
    const fileName = `lugar_${idLugar}.${extension}`

    console.log('Iniciando subida de imagen:', fileName)

    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    })

    console.log('Base64 obtenido, longitud:', base64.length)

    const { data, error } = await supabase.storage
      .from('lugares')
      .upload(fileName, decode(base64), {
        contentType: `image/${extension}`,
        upsert: true,
      })

    console.log('Resultado upload:', data, error)

    if (error) {
      console.log('Error subiendo imagen:', error.message)
      return null
    }

    const { data: urlData } = supabase.storage
      .from('lugares')
      .getPublicUrl(fileName)

    console.log('URL pública:', urlData.publicUrl)

    return urlData.publicUrl
  }

  const handleAgregarLugar = async () => {
    if (!nombre || !descripcion || !categoria || !latitud || !longitud) {
      Alert.alert('Error', 'Por favor completa todos los campos obligatorios')
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: negocio, error: negocioError } = await supabase
      .from('negocios')
      .select('id_negocio')
      .eq('id_usuario', user.id)
      .single()

    if (negocioError || !negocio) {
      Alert.alert('Error', 'No se encontró el negocio')
      return
    }

    // Insertar lugar
    const { data: lugarCreado, error: lugarError } = await supabase
      .from('lugares')
      .insert([{
        nombre,
        descripcion,
        categoria,
        latitud: parseFloat(latitud),
        longitud: parseFloat(longitud),
        id_negocio: negocio.id_negocio
      }])
      .select()
      .single()

    if (lugarError || !lugarCreado) {
      Alert.alert('Error', lugarError?.message || 'Error al crear el lugar')
      return
    }

    // Subir imagen si hay una
    if (imagen) {
      const urlImagen = await subirImagen(imagen, lugarCreado.id_lugar)
      if (urlImagen) {
        await supabase
          .from('lugares')
          .update({ imagen: urlImagen })
          .eq('id_lugar', lugarCreado.id_lugar)
      }
    }

    // Insertar servicios
    const serviciosValidos = servicios.filter(s => s.nombre && s.precio)
    if (serviciosValidos.length > 0) {
      const { error: serviciosError } = await supabase
        .from('servicios')
        .insert(serviciosValidos.map(s => ({
          nombre: s.nombre,
          precio: parseFloat(s.precio),
          id_lugar: lugarCreado.id_lugar
        })))

      if (serviciosError) {
        Alert.alert('Error', serviciosError.message)
        return
      }
    }

    Alert.alert('Éxito', 'Lugar agregado correctamente', [
      { text: 'OK', onPress: () => navigation.goBack() }
    ])
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Agregar lugar</Text>

      <TextInput
        style={styles.input}
        placeholder="Nombre del lugar"
        placeholderTextColor="#A0A0A0"
        value={nombre}
        onChangeText={setNombre}
      />

      <TextInput
        style={styles.input}
        placeholder="Descripción"
        placeholderTextColor="#A0A0A0"
        value={descripcion}
        onChangeText={setDescripcion}
        multiline
        numberOfLines={3}
      />

      <TextInput
        style={styles.input}
        placeholder="Categoría (restaurante, parque, tienda...)"
        placeholderTextColor="#A0A0A0"
        value={categoria}
        onChangeText={setCategoria}
      />

      <TextInput
        style={styles.input}
        placeholder="Latitud (ej: 6.2442)"
        placeholderTextColor="#A0A0A0"
        value={latitud}
        onChangeText={setLatitud}
        keyboardType="decimal-pad"
      />

      <TextInput
        style={styles.input}
        placeholder="Longitud (ej: -75.5812)"
        placeholderTextColor="#A0A0A0"
        value={longitud}
        onChangeText={setLongitud}
        keyboardType="decimal-pad"
      />

      {/* Foto del lugar */}
      <TouchableOpacity style={styles.botonImagen} onPress={seleccionarImagen}>
        <Text style={styles.botonImagenTexto}>
          {imagen ? 'Cambiar foto' : 'Agregar foto del lugar'}
        </Text>
      </TouchableOpacity>

      {imagen && (
        <Image source={{ uri: imagen }} style={styles.imagenPreview} />
      )}

      {/* Servicios */}
      <Text style={styles.seccionTitulo}>Servicios</Text>

      {servicios.map((servicio, index) => (
        <View key={index} style={styles.servicioContainer}>
          <TextInput
            style={[styles.input, styles.servicioInput]}
            placeholder="Nombre del servicio"
            placeholderTextColor="#A0A0A0"
            value={servicio.nombre}
            onChangeText={(valor) => actualizarServicio(index, 'nombre', valor)}
          />
          <TextInput
            style={[styles.input, styles.servicioInput]}
            placeholder="Precio"
            placeholderTextColor="#A0A0A0"
            value={servicio.precio}
            onChangeText={(valor) => actualizarServicio(index, 'precio', valor)}
            keyboardType="decimal-pad"
          />
          {servicios.length > 1 && (
            <TouchableOpacity
              style={styles.botonEliminar}
              onPress={() => eliminarServicio(index)}
            >
              <Text style={styles.botonEliminarTexto}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}

      <TouchableOpacity style={styles.botonAgregarServicio} onPress={agregarServicio}>
        <Text style={styles.botonAgregarServicioTexto}>+ Agregar servicio</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.boton} onPress={handleAgregarLugar}>
        <Text style={styles.botonTexto}>Guardar lugar</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.botonCancelar}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.botonTexto}>Cancelar</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#121212',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 32,
  },
  input: {
    backgroundColor: '#1E1E1E',
    color: '#FFFFFF',
    borderRadius: 8,
    padding: 14,
    marginBottom: 16,
    fontSize: 16,
  },
  botonImagen: {
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#4A90E2',
    borderStyle: 'dashed',
  },
  botonImagenTexto: {
    color: '#4A90E2',
    fontSize: 16,
  },
  imagenPreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 16,
  },
  seccionTitulo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
    marginTop: 8,
  },
  servicioContainer: {
    marginBottom: 8,
  },
  servicioInput: {
    marginBottom: 8,
  },
  botonEliminar: {
    alignSelf: 'flex-end',
    marginBottom: 8,
  },
  botonEliminarTexto: {
    color: '#E74C3C',
    fontSize: 16,
  },
  botonAgregarServicio: {
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#4A90E2',
  },
  botonAgregarServicioTexto: {
    color: '#4A90E2',
    fontSize: 16,
  },
  boton: {
    backgroundColor: '#4A90E2',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  botonCancelar: {
    backgroundColor: '#E74C3C',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  botonTexto: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
})