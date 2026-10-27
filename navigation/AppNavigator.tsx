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
import AdminHomeScreen from '../screens/admin/AdminHomeScreen'
import BusinessHomeScreen from '../screens/BusinessHomeScreen'
import AddPlaceScreen from '../screens/AddPlaceScreen'
import MisPlanesScreen from '../screens/planes/MisPlanesScreen'
import MapaScreen from '../screens/MapaScreen'
import CrearPlanScreen from '../screens/planes/CrearPlanScreen'
import { PlanBorradorProvider } from '../context/PlanBorradorContext'
import PlanDetalleScreen from '../screens/planes/PlanDetalleScreen'
import NotificacionesScreen from '../screens/NotificacionesScreen'
import ExplorarPlanesScreen from '../screens/planes/ExplorarPlanesScreen'
import ForosScreen from '../screens/foro/ForosScreen'
import ForoDetalleScreen from '../screens/foro/ForoDetalleScreen'

export type RootStackParamList = {
  Login: undefined
  Register: undefined
  RegisterBusiness: undefined
  Home: undefined
  BusinessHome: undefined
  AdminHome: undefined
  AddPlace: undefined
  MisPlanes: undefined
  CrearPlan: { idPlan?: number } | undefined
  PlanDetalle: { idPlan: number }
  ExplorarPlanes: undefined
  Notificaciones: undefined
  Foros: undefined
  ForoDetalle: { idForo: number }
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
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session)
      if (session) {
        setLoadingRol(true)
        await obtenerRol(session.user.id)
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
    <PlanBorradorProvider key={session?.user.id ?? 'anon'}>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName={getInitialRoute()}
          screenOptions={{ headerShown: false }}
        >
          {session ? (
            <>
              <Stack.Screen name="Home" component={HomeScreen} />
              <Stack.Screen name="BusinessHome" component={BusinessHomeScreen} />
              <Stack.Screen name="AdminHome" component={AdminHomeScreen} />
              <Stack.Screen name="AddPlace" component={AddPlaceScreen} />
              <Stack.Screen name="MisPlanes" component={MisPlanesScreen} />
              <Stack.Screen name="CrearPlan" component={CrearPlanScreen} />
              <Stack.Screen name="PlanDetalle" component={PlanDetalleScreen} />
              <Stack.Screen name="ExplorarPlanes" component={ExplorarPlanesScreen} />
              <Stack.Screen name="Notificaciones" component={NotificacionesScreen} />
              <Stack.Screen name="Foros" component={ForosScreen} />
              <Stack.Screen name="ForoDetalle" component={ForoDetalleScreen} />
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