import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import LoginScreen from '../screens/LoginScreen'
import RegisterScreen from '../screens/RegisterScreen'
import { useEffect, useState } from 'react'
import { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import HomeScreen from '../screens/HomeScreen'
import RegisterBusinessScreen from '../screens/RegisterBusinessScreen'



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

  const obtenerRol = async (userId: string) => {
    const { data, error } = await supabase
      .from('usuarios')
      .select('rol')
      .eq('id_usuario', userId)
      .single()

    if (!error && data) {
      setRol(data.rol)
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) obtenerRol(session.user.id)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
        if (session) {
          obtenerRol(session.user.id)
        } else {
          setRol(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  if (loading) return null

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
            <Stack.Screen name="AdminHome" component={HomeScreen} />
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