import { useCallback, useEffect, useRef, useState } from 'react'
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, ScrollView, RefreshControl } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { RootStackParamList } from '../../navigation/AppNavigator'
import { colors } from '../../theme/colors'
import { PlanPublico } from '../../types/social'
import { explorarPlanes } from '../../lib/explorarApi'
import { formatearFecha, formatearHora, formatearCOP, ETIQUETA_TRANSPORTE } from '../../lib/planesApi'

type Props = NativeStackScreenProps<RootStackParamList, 'ExplorarPlanes'>

const PRECIOS: { label: string; v: number | null }[] = [
  { label: '≤ $20.000', v: 20000 }, { label: '≤ $50.000', v: 50000 },
  { label: '≤ $100.000', v: 100000 }, { label: 'Todos', v: null },
]

export default function ExplorarPlanesScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets()
  const peticion = useRef(0)
  const [q, setQ] = useState('')
  const [precio, setPrecio] = useState<number | null>(null)
  const [items, setItems] = useState<PlanPublico[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const cargar = useCallback(async () => {
    const id = ++peticion.current
    setLoading(true)
    setError(null)
    try {
      const data = await explorarPlanes({ presupuestoMax: precio, busqueda: q })
      if (id === peticion.current) setItems(data)
    } catch (e: any) {
      if (id === peticion.current) setError(e.message ?? 'No se pudieron cargar los planes')
    }
    if (id === peticion.current) setLoading(false)
  }, [q, precio])

  useEffect(() => {
    const t = setTimeout(cargar, 350) // espera a que termines de escribir
    return () => clearTimeout(t)
  }, [cargar])

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={s.back}>‹ Volver</Text></TouchableOpacity>
        <Text style={s.title}>Explorar planes</Text>
        <View style={{ width: 70 }} />
      </View>

      <TextInput
        style={s.search}
        placeholder="Buscar planes por nombre"
        placeholderTextColor={colors.textMuted}
        value={q}
        onChangeText={setQ}
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips}>
        {PRECIOS.map(p => (
          <TouchableOpacity key={p.label} style={[s.chip, precio === p.v && s.chipActive]} onPress={() => setPrecio(p.v)}>
            <Text style={[s.chipText, precio === p.v && { color: colors.text }]}>{p.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {error ? (
        <TouchableOpacity onPress={cargar}>
          <Text style={s.error}>{error} · Toca para reintentar</Text>
        </TouchableOpacity>
      ) : (
        <FlatList
          data={items}
          keyExtractor={p => String(p.id_plan)}
          contentContainerStyle={{ padding: 16, paddingBottom: 24 + insets.bottom, gap: 12 }}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={cargar} tintColor={colors.primary} />}
          ListEmptyComponent={
            !loading ? <Text style={s.empty}>Aún no hay planes públicos que coincidan. ¡Publica el tuyo con "Plan público"!</Text> : null
          }
          renderItem={({ item }) => (
            <TouchableOpacity style={s.card} activeOpacity={0.8} onPress={() => navigation.navigate('PlanDetalle', { idPlan: item.id_plan })}>
              <Text style={s.name} numberOfLines={1}>{item.nombre}</Text>
              <Text style={s.author}>por {item.autor}</Text>
              <Text style={s.date}>
                {formatearFecha(item.fecha)}{item.hora_inicio ? `  ·  ${formatearHora(item.hora_inicio)}` : ''}
              </Text>
              <Text style={s.meta}>
                {item.num_paradas} {item.num_paradas === 1 ? 'parada' : 'paradas'}  ·  {formatearCOP(item.costo_estimado)} por persona  ·  {ETIQUETA_TRANSPORTE[item.modo_transporte] ?? 'A pie'}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12 },
  back: { color: colors.primary, fontWeight: 'bold', width: 70 },
  title: { color: colors.text, fontSize: 22, fontWeight: 'bold' },
  search: { backgroundColor: colors.surface, color: colors.text, borderRadius: 8, padding: 14, margin: 16, marginBottom: 8, fontSize: 16 },
  chips: { paddingHorizontal: 16, gap: 8, paddingBottom: 4 },
  chip: { backgroundColor: colors.surface, borderRadius: 16, paddingVertical: 8, paddingHorizontal: 14 },
  chipActive: { backgroundColor: colors.primary },
  chipText: { color: colors.textMuted, fontWeight: 'bold', fontSize: 13 },
  card: { backgroundColor: colors.surface, borderRadius: 12, padding: 16 },
  name: { color: colors.text, fontSize: 18, fontWeight: 'bold' },
  author: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  date: { color: colors.primary, fontSize: 14, fontWeight: 'bold', marginTop: 8 },
  meta: { color: colors.textMuted, fontSize: 13, marginTop: 4 },
  empty: { color: colors.textMuted, textAlign: 'center', marginTop: 48, paddingHorizontal: 16 },
  error: { color: colors.danger, textAlign: 'center', margin: 24 },
})