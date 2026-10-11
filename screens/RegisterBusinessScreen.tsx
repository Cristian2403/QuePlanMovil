import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native'
import { supabase } from '../lib/supabase'
import { useFonts, Pacifico_400Regular } from '@expo-google-fonts/pacifico'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RootStackParamList } from '../navigation/AppNavigator'

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'RegisterBusiness'>
}

export default function RegisterBusinessScreen({ navigation }: Props) {
  const [nombre, setNombre] = useState<string>('')
  const [email, setEmail] = useState<string>('')
  const [contrasena, setContrasena] = useState<string>('')
  const [direccion, setDireccion] = useState<string>('')
  const [telefono, setTelefono] = useState<string>('')

  const [fontsLoaded] = useFonts({ Pacifico_400Regular })

  const handleRegisterBusiness = async () => {
    if (!nombre || !email || !contrasena || !direccion || !telefono) {
      Alert.alert('Error', 'Por favor completa todos los campos')
      return
    }

    // 1. Crear cuenta en Supabase Auth
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password: contrasena,
      options: {
        data: {
          nombre,
          rol: 'negocio'
        }
      }
    })

    if (authError) {
      Alert.alert('Error', authError.message)
      return
    }

    // 2. Insertar en tabla negocios
    const { error: businessError } = await supabase
      .from('negocios')
      .insert([{
        nombre,
        direccion,
        telefono,
        id_usuario: data.user?.id
      }])

    if (businessError) {
      Alert.alert('Error', businessError.message)
      return
    }

    Alert.alert(
      'Éxito',
      'Negocio registrado correctamente, espera la aprobación del administrador'
    )
  }

  if (!fontsLoaded) return null

  return (
    <ScrollView contentContainerStyle={styles.container}>

      <View style={styles.logoContainer}>
        <Text style={[styles.logo, { fontFamily: 'Pacifico_400Regular' }]}>¿Que</Text>
        <Text style={[styles.logo, { fontFamily: 'Pacifico_400Regular' }]}>Plan?</Text>
      </View>

      <Text style={styles.title}>Registrar negocio</Text>

      <TextInput
        style={styles.input}
        placeholder="Nombre del negocio"
        placeholderTextColor="#A0A0A0"
        value={nombre}
        onChangeText={setNombre}
      />

      <TextInput
        style={styles.input}
        placeholder="Correo electrónico"
        placeholderTextColor="#A0A0A0"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        placeholderTextColor="#A0A0A0"
        value={contrasena}
        onChangeText={setContrasena}
        secureTextEntry
      />

      <TextInput
        style={styles.input}
        placeholder="Dirección"
        placeholderTextColor="#A0A0A0"
        value={direccion}
        onChangeText={setDireccion}
      />

      <TextInput
        style={styles.input}
        placeholder="Teléfono"
        placeholderTextColor="#A0A0A0"
        value={telefono}
        onChangeText={setTelefono}
        keyboardType="phone-pad"
      />

      <TouchableOpacity style={styles.button} onPress={handleRegisterBusiness}>
        <Text style={styles.buttonText}>Registrar negocio</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.loginLink}
        onPress={() => navigation.navigate('Login')}
      >
        <Text style={styles.loginText}>
          ¿Ya tienes cuenta? <Text style={styles.loginTextAccent}>Inicia sesión</Text>
        </Text>
      </TouchableOpacity>

    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#121212',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    fontSize: 48,
    color: '#4A90E2',
    lineHeight: 52,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 32,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#1E1E1E',
    color: '#FFFFFF',
    borderRadius: 8,
    padding: 14,
    marginBottom: 16,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#4A90E2',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginLink: {
    marginTop: 24,
    alignItems: 'center',
  },
  loginText: {
    color: '#A0A0A0',
    fontSize: 14,
  },
  loginTextAccent: {
    color: '#4A90E2',
    fontWeight: 'bold',
  },
})