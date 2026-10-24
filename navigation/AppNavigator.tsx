import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import LoginScreen from '../screens/LoginScreen'
import RegisterScreen from '../screens/RegisterScreen'
import { useEffect, useState } from 'react'
import { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import HomeScreen from '../screens/HomeScreen'
import RegisterBusinessScreen from '../screens/RegisterBusinessScreen'
import { Alert } from 'react-native'
import AdminHomeScreen from '../screens/AdminHomeScreen'



export type RootStackParamList = {
  Login: undefined
  Register: undefined
  RegisterBusiness: undefined
  Home: undefined
  BusinessHome: undefined
  AdminHome: undefined
}

const Stack = createNativeStackNavigator<RootStackParamList>()

export default function AppNavigator() {

  const [session, setSession] = useState<Session | null>(null)
  const [rol, setRol] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [loadingRol, setLoadingRol] = useState<boolean>(false)

  const obtenerRol = async (userId: string) => {
    const { data, error } = await supabase
      .from('usuarios')
      .select('rol')
      .eq('id_usuario', userId)
      .single()

    if (!error && data) {
      if (data.rol === 'negocio') {
        const { data: negocio, error: negocioError } = await supabase
          .from('negocios')
          .select('estado')
          .eq('id_usuario', userId)
          .single()

        if (!negocioError && negocio) {
          if (negocio.estado === 'pendiente') {
            Alert.alert('Solicitud pendiente', 'Tu negocio aún no ha sido aprobado por el administrador.')
            await supabase.auth.signOut()
            setLoadingRol(false)
            return
          } else if (negocio.estado === 'rechazado') {
            Alert.alert('Solicitud rechazada', 'Tu negocio ha sido rechazado por el administrador.')
            await supabase.auth.signOut()
            setLoadingRol(false)
            return
          }
        }
      }
      setRol(data.rol)
    }
    setLoadingRol(false)
  }
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) {
        setLoadingRol(true)
        obtenerRol(session.user.id)
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
        if (session) {
          setLoadingRol(true)
          obtenerRol(session.user.id)
        } else {
          setRol(null)
          setLoadingRol(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  if (loading || loadingRol) return null

  const getInitialRoute = () => {
    if (!session) return 'Login'
    if (rol === 'negocio') return 'BusinessHome'
    if (rol === 'administrador') return 'AdminHome'
    return 'Home'
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={getInitialRoute()}
        screenOptions={{ headerShown: false }}
      >
        {session ? (
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="BusinessHome" component={HomeScreen} />
            <Stack.Screen name="AdminHome" component={AdminHomeScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="RegisterBusiness" component={RegisterBusinessScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
}