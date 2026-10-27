import { useCallback, useEffect, useRef, useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, Platform } from 'react-native'
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps'
import * as Location from 'expo-location'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { RootStackParamList } from '../navigation/AppNavigator'
import { supabase } from '../lib/supabase'
import { colors } from '../theme/colors'
import { LugarMapa } from '../types/planes'
import { listarLugaresDisponibles } from '../lib/lugaresApi'
import { formatearCOP } from '../lib/planesApi'
import { usePlanBorrador } from '../context/PlanBorradorContext'
import MenuFlotante, { ItemMenu } from '../components/MenuFlotante'
import { useFocusEffect } from '@react-navigation/native'
import { contarNoLeidas } from '../lib/notificacionesApi'

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>

const MEDELLIN = { latitude: 6.2442, longitude: -75.5812 }

const RADIOS: { label: string; v: number | null }[] = [
  { label: '1 km', v: 1 }, { label: '3 km', v: 3 }, { label: '5 km', v: 5 }, { label: 'Todos', v: null },
]
const PRECIOS: { label: string; v: number | null }[] = [
  { label: '≤ $20.000', v: 20000 }, { label: '≤ $50.000', v: 50000 },
  { label: '≤ $100.000', v: 100000 }, { label: 'Todos', v: null },
]

const precioTexto = (n: number | null) =>
  n === null ? 'Precio no indicado' : n === 0 ? 'Gratis' : `${formatearCOP(n)} por persona`
const distanciaTexto = (km: number) => (km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`)

function Chips({ titulo, opciones, valor, onChange }: {
  titulo: string
  opciones: { label: string; v: number | null }[]
  valor: number | null
  onChange: (v: number | null) => void
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chipsRow}>
      <Text style={s.chipsTitle}>{titulo}</Text>
      {opciones.map(o => (
        <TouchableOpacity key={o.label} style={[s.chip, valor === o.v && s.chipActive]} onPress={() => onChange(o.v)}>
          <Text style={[s.chipText, valor === o.v && { color: colors.text }]}>{o.label}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  )
}

export default function MapaScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets()
  const mapRef = useRef<MapView>(null)
  const peticion = useRef(0)
  const { paradas, agregar, quitar, estaEnPlan } = usePlanBorrador()

  const [origen, setOrigen] = useState(MEDELLIN)
  const [permiso, setPermiso] = useState<boolean | null>(null)
  const [lugares, setLugares] = useState<LugarMapa[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [radio, setRadio] = useState<number | null>(null)
  const [precio, setPrecio] = useState<number | null>(null)
  const [seleccionadoId, setSeleccionadoId] = useState<number | null>(null)
  const [menuAbierto, setMenuAbierto] = useState(false)
  const [noLeidas, setNoLeidas] = useState(0)

  
  useFocusEffect(useCallback(() => {
    contarNoLeidas().then(setNoLeidas).catch(() => {})
  }, []))

  useEffect(() => {
    let activo = true
    ;(async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync()
        if (status !== 'granted') { if (activo) setPermiso(false); return }
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
        if (!activo) return
        const c = { latitude: pos.coords.latitude, longitude: pos.coords.longitude }
        setOrigen(c)
        setPermiso(true)
        mapRef.current?.animateToRegion({ ...c, latitudeDelta: 0.05, longitudeDelta: 0.05 }, 600)
      } catch {
        if (activo) setPermiso(false)
      }
    })()
    return () => { activo = false }
  }, [])

  const cargar = useCallback(async () => {
    const id = ++peticion.current
    setLoading(true)
    setError(null)
    try {
      const data = await listarLugaresDisponibles({
        lat: origen.latitude, lng: origen.longitude, radioKm: radio, precioMax: precio,
      })
      if (id === peticion.current) setLugares(data)
    } catch (e: any) {
      if (id === peticion.current) setError(e.message ?? 'No se pudieron cargar los lugares')
    }
    if (id === peticion.current) setLoading(false)
  }, [origen, radio, precio])

  useEffect(() => { cargar() }, [cargar])

  const sel = lugares.find(l => l.id_lugar === seleccionadoId) ?? null
  const proximamente = (nombre: string) => () => Alert.alert('Próximamente', `${nombre} llega en una próxima etapa.`)

  const alternarEnPlan = (l: LugarMapa) => {
    if (estaEnPlan(l.id_lugar)) return quitar(l.id_lugar)
    const ok = agregar({
      id_lugar: l.id_lugar, nombre: l.nombre, categoria: l.categoria,
      precio_promedio: l.precio_promedio, latitud: l.latitud, longitud: l.longitud,
    })
    if (!ok) Alert.alert('Límite alcanzado', 'Un plan puede tener hasta 10 paradas.')
  }

  const itemsMenu: ItemMenu[] = [
    { label: 'Crear plan', onPress: () => navigation.navigate('CrearPlan') },
    { label: 'Mis planes', onPress: () => navigation.navigate('MisPlanes') },
    { label: 'Explorar planes', onPress: () => navigation.navigate('ExplorarPlanes') },
    { label: 'Foro', onPress: () => navigation.navigate('Foros') },
    { label: 'Favoritos', onPress: proximamente('Favoritos') },
    { label: 'Notificaciones', onPress: () => navigation.navigate('Notificaciones') },
    { label: 'Cerrar sesión', destructive: true, onPress: () => { supabase.auth.signOut() } },
  ]

  const centrar = () =>
    mapRef.current?.animateToRegion({ ...origen, latitudeDelta: 0.05, longitudeDelta: 0.05 }, 500)

  const barraH = paradas.length > 0 ? 64 : 0

  return (
    <View style={s.container}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={{ ...MEDELLIN, latitudeDelta: 0.08, longitudeDelta: 0.08 }}
        showsUserLocation={permiso === true}
        showsMyLocationButton={false}
        toolbarEnabled={false}
        onPress={() => setSeleccionadoId(null)}
      >
        {lugares.map(l => (
          <Marker
            key={l.id_lugar}
            coordinate={{ latitude: l.latitud, longitude: l.longitud }}
            pinColor={estaEnPlan(l.id_lugar) ? colors.success : colors.primary}
            onPress={e => { e.stopPropagation(); setSeleccionadoId(l.id_lugar) }}
          />
        ))}
      </MapView>

      <View style={[s.top, { top: insets.top + 8 }]} pointerEvents="box-none">
        <View style={s.topRow}>
          <TouchableOpacity style={s.menuBtn} onPress={() => setMenuAbierto(true)}>
            <Text style={s.menuIcon}>☰</Text>
            {noLeidas > 0 && <View style = {s.dot} />}
          </TouchableOpacity>
          <View style={s.pill}>
            <Text style={s.pillText}>{loading ? 'Buscando…' : `${lugares.length} lugares`}</Text>
          </View>
        </View>
        <Chips titulo="Distancia" opciones={RADIOS} valor={radio} onChange={setRadio} />
        <Chips titulo="Precio" opciones={PRECIOS} valor={precio} onChange={setPrecio} />
        {permiso === false && (
          <Text style={s.note}>Sin ubicación: las distancias se miden desde el centro de Medellín.</Text>
        )}
        {error && (
          <TouchableOpacity style={s.errorBox} onPress={cargar}>
            <Text style={s.errorText}>{error} · Toca para reintentar</Text>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity style={[s.locBtn, { bottom: (sel ? 210 : 24) + insets.bottom + barraH }]} onPress={centrar}>
        <Text style={s.locIcon}>◎</Text>
      </TouchableOpacity>

      {sel && (
        <View style={[s.card, { bottom: 16 + insets.bottom + barraH }]}>
          <Text style={s.cardTitle}>{sel.nombre}</Text>
          <Text style={s.cardMeta}>{[sel.categoria, sel.negocio_nombre].filter(Boolean).join('  ·  ')}</Text>
          <Text style={s.cardMeta}>
            {precioTexto(sel.precio_promedio)}
            {sel.distancia_km !== null ? `  ·  ${distanciaTexto(sel.distancia_km)}` : ''}
          </Text>
          {!!sel.descripcion && <Text style={s.cardDesc} numberOfLines={2}>{sel.descripcion}</Text>}
          <TouchableOpacity
            style={[s.addBtn, estaEnPlan(sel.id_lugar) && s.addBtnOn]}
            onPress={() => alternarEnPlan(sel)}
          >
            <Text style={s.addText}>{estaEnPlan(sel.id_lugar) ? 'Quitar de mi plan' : 'Agregar a mi plan'}</Text>
          </TouchableOpacity>
        </View>
      )}

      {paradas.length > 0 && (
        <TouchableOpacity style={[s.planBar, { bottom: 12 + insets.bottom }]} onPress={() => navigation.navigate('CrearPlan')}>
          <Text style={s.planBarText}>
            Tu plan · {paradas.length} {paradas.length === 1 ? 'parada' : 'paradas'}
          </Text>
          <Text style={s.planBarAction}>Ver plan ›</Text>
        </TouchableOpacity>
      )}

      <MenuFlotante visible={menuAbierto} onClose={() => setMenuAbierto(false)} items={itemsMenu} />
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  top: { position: 'absolute', left: 12, right: 12, gap: 8 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  menuBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' },
  menuIcon: { color: colors.text, fontSize: 20 },
  pill: { backgroundColor: colors.background, borderRadius: 16, paddingVertical: 8, paddingHorizontal: 14 },
  pillText: { color: colors.text, fontWeight: 'bold', fontSize: 13 },
  chipsRow: { alignItems: 'center', gap: 8, paddingRight: 8 },
  chipsTitle: { color: colors.text, fontSize: 12, fontWeight: 'bold', backgroundColor: colors.background, borderRadius: 10, paddingVertical: 6, paddingHorizontal: 10, overflow: 'hidden' },
  chip: { backgroundColor: colors.background, borderRadius: 16, paddingVertical: 8, paddingHorizontal: 14 },
  chipActive: { backgroundColor: colors.primary },
  chipText: { color: colors.textMuted, fontWeight: 'bold', fontSize: 13 },
  note: { color: colors.text, fontSize: 12, backgroundColor: colors.background, borderRadius: 10, padding: 8, overflow: 'hidden' },
  errorBox: { backgroundColor: colors.danger, borderRadius: 10, padding: 10 },
  errorText: { color: colors.text, fontSize: 13, fontWeight: 'bold' },
  locBtn: { position: 'absolute', right: 16, width: 48, height: 48, borderRadius: 24, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' },
  locIcon: { color: colors.primary, fontSize: 24 },
  card: { position: 'absolute', left: 16, right: 16, backgroundColor: colors.surface, borderRadius: 14, padding: 16 },
  cardTitle: { color: colors.text, fontSize: 18, fontWeight: 'bold' },
  cardMeta: { color: colors.textMuted, fontSize: 13, marginTop: 3 },
  cardDesc: { color: colors.text, fontSize: 14, marginTop: 8 },
  addBtn: { backgroundColor: colors.primary, borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 12 },
  addBtnOn: { backgroundColor: colors.border },
    dot: { position: 'absolute', top: 9, right: 9, width: 10, height: 10, borderRadius: 5, backgroundColor: colors.danger },
  addText: { color: colors.text, fontWeight: 'bold', fontSize: 15 },
  planBar: { position: 'absolute', left: 16, right: 16, height: 52, backgroundColor: colors.success, borderRadius: 12, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  planBarText: { color: colors.text, fontWeight: 'bold', fontSize: 15 },
  planBarAction: { color: colors.text, fontWeight: 'bold', fontSize: 15 },
})