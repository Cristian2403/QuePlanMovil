import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { supabase } from '../lib/supabase'
import { useFonts, Pacifico_400Regular } from '@expo-google-fonts/pacifico'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RootStackParamList } from '../navigation/AppNavigator'


type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Login'>
}


export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState<string>('')
  const [contrasena, setContrasena] = useState<string>('')

  const [fontsLoaded] = useFonts({ Pacifico_400Regular })

  const handleLogin = async () => {
    if (!email || !contrasena) {
      Alert.alert('Error', 'Por favor completa todos los campos')
      return
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: contrasena,
    })

    if (error) {
      Alert.alert('Error', error.message)
    } else {
      Alert.alert('Éxito', 'Sesión iniciada correctamente')
    }
  }

  if (!fontsLoaded) return null

  return (
    <View style={styles.container}>

      <View style={styles.logoContainer}>
        <Text style={[styles.logo, { fontFamily: 'Pacifico_400Regular' }]}>¿Que</Text>
        <Text style={[styles.logo, { fontFamily: 'Pacifico_400Regular' }]}>Plan?</Text>
      </View>

      <Text style={styles.title}>Iniciar sesión</Text>

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

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Iniciar sesión</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.registerLink} onPress={() => navigation.navigate('Register')}>
        <Text style={styles.registerText}>
          ¿No tienes cuenta? <Text style={styles.registerTextAccent}>Regístrate</Text>
        </Text>
      </TouchableOpacity>


      <TouchableOpacity
        style={styles.businessLink}
        onPress={() => navigation.navigate('RegisterBusiness')}
      >
        <Text style={styles.registerText}>
          ¿Eres un negocio? <Text style={styles.registerTextAccent}>Regístrate aquí</Text>
        </Text>
      </TouchableOpacity>

    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
    width: '100%',

  },
  logo: {
    fontSize: 48,
    color: '#4A90E2',
    lineHeight: 78,
    textAlign: 'center',       // Obliga al texto a centrarse dentro de su propia caja
    alignSelf: 'center',
    overflow: 'visible', // Evita que Android corte los bordes del texto
    minWidth: '100%',
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
  registerLink: {
    marginTop: 24,
    alignItems: 'center',
  },
  registerText: {
    color: '#A0A0A0',
    fontSize: 14,
  },
  registerTextAccent: {
    color: '#4A90E2',
    fontWeight: 'bold',
  },
  businessLink: {
    marginTop: 12,
    alignItems: 'center',
  },
})