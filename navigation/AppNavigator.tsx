import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import LoginScreen from '../screens/LoginScreen'
import RegisterScreen from '../screens/RegisterScreen'
import { useEffect, useState } from 'react'
import { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import HomeScreen from '../screens/HomeScreen'
import RegisterBusinessScreen from '../screens/RegisterBusinessScreen'
import AdminHomeScreen from '../screens/admin/AdminHomeScreen'
import MisPlanesScreen from '../screens/planes/MisPlanesScreen'
import MapaScreen from '../screens/MapaScreen'
import CrearPlanScreen from '../screens/planes/CrearPlanScreen' // NUEVO
import { PlanBorradorProvider } from '../context/PlanBorradorContext'
import PlanDetalleScreen from '../screens/planes/PlanDetalleScreen'

export type RootStackParamList = {
  Login: undefined
  Register: undefined
  RegisterBusiness: undefined
  Home: undefined
  BusinessHome: undefined
  AdminHome: undefined
  MisPlanes: undefined
  CrearPlan: { idPlan?: number } | undefined
  PlanDetalle: { idPlan: number }
  
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

    setRol(!error && data ? data.rol : 'usuario')
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session)
      if (session) await obtenerRol(session.user.id)
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

  if (loading || (session && !rol)) return null

  const getInitialRoute = () => {
    if (!session) return 'Login'
    if (rol === 'negocio') return 'BusinessHome'
    if (rol === 'administrador') return 'AdminHome'
    return 'Home'
  }

  return (
    // NUEVO: el "key" reinicia el borrador del plan al cambiar de usuario o cerrar sesión
    <PlanBorradorProvider key={session?.user.id ?? 'anon'}>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName={getInitialRoute()}
          screenOptions={{ headerShown: false }}
        >
          {session ? (
            <>
              <Stack.Screen name="Home" component={MapaScreen} />
              <Stack.Screen name="BusinessHome" component={HomeScreen} />
              <Stack.Screen name="AdminHome" component={AdminHomeScreen} />
              <Stack.Screen name="MisPlanes" component={MisPlanesScreen} />
              <Stack.Screen name="CrearPlan" component={CrearPlanScreen} />
              <Stack.Screen name="PlanDetalle" component={PlanDetalleScreen} />
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
    </PlanBorradorProvider>
  )
}