import { useCallback, useMemo, useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, SafeAreaView } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { RootStackParamList } from '../../navigation/AppNavigator'
import { colors } from '../../theme/colors'
import { PlanConParadas, ModoTransporte } from '../../types/planes'
import {
  listarMisPlanes, hoyISO, formatearFecha, formatearHora, formatearCOP, ETIQUETA_TRANSPORTE,
} from '../../lib/planesApi'

type Props = NativeStackScreenProps<RootStackParamList, 'MisPlanes'>
type Vista = 'proximos' | 'pasados'

const esPasado = (p: PlanConParadas) =>
  (!!p.fecha && p.fecha < hoyISO()) || p.estado === 'completado' || p.estado === 'cancelado'

export default function MisPlanesScreen({ navigation }: Props) {
  const [planes, setPlanes] = useState<PlanConParadas[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [vista, setVista] = useState<Vista>('proximos')

  const cargar = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setPlanes(await listarMisPlanes())
    } catch (e: any) {
      setError(e.message ?? 'No se pudieron cargar tus planes')
    }
    setLoading(false)
  }, [])

  // Recarga cada vez que la pantalla vuelve a estar en primer plano
  useFocusEffect(useCallback(() => { cargar() }, [cargar]))

  const lista = useMemo(() => {
    if (vista === 'proximos') return planes.filter(p => !esPasado(p))
    return planes.filter(esPasado).reverse() // más reciente primero
  }, [planes, vista])

  // Se conectan en las etapas 4 y 5
  const nuevoPlan = () => navigation.navigate('CrearPlan')
  const abrirPlan = (p: PlanConParadas) => navigation.navigate('PlanDetalle', { idPlan: p.id_plan })

  const colorEstado = (e: string | null) => 
    e === 'activo' ? colors.success : e === 'borrador' ? colors.warning : colors.textMuted
  const textoEstado = (e: string | null) =>
    e === 'activo' ? 'Confirmado' : e === 'borrador' ? 'Borrador'
    : e === 'completado' ? 'Completado' : e === 'cancelado' ? 'Cancelado' : (e ?? '')
 
  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={s.back}>‹ Volver</Text>
        </TouchableOpacity>
        <Text style={s.title}>Mis planes</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={s.tabs}>
        {(['proximos', 'pasados'] as Vista[]).map(v => (
          <TouchableOpacity key={v} style={[s.tab, vista === v && s.tabActive]} onPress={() => setVista(v)}>
            <Text style={[s.tabText, vista === v && s.tabTextActive]}>
              {v === 'proximos' ? 'Próximos' : 'Pasados'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {error ? (
        <View style={s.center}>
          <Text style={s.errorText}>{error}</Text>
          <TouchableOpacity style={s.retry} onPress={cargar}>
            <Text style={s.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={lista}
          keyExtractor={p => String(p.id_plan)}
          contentContainerStyle={{ padding: 16, paddingBottom: 100, gap: 12 }}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={cargar} tintColor={colors.primary} />}
          ListEmptyComponent={
            !loading ? (
              <Text style={s.empty}>
                {vista === 'proximos'
                  ? 'Aún no tienes planes. ¡Crea el primero!'
                  : 'No tienes planes pasados.'}
              </Text>
            ) : null
          }
          renderItem={({ item }) => {
            const paradas = item.plan_lugares?.length ?? 0
            return (
              <TouchableOpacity style={s.card} onPress={() => abrirPlan(item)} activeOpacity={0.8}>
                <View style={s.cardTop}>
                  <Text style={s.name} numberOfLines={1}>{item.nombre}</Text>
                  <Text style={[s.badge, { color: colorEstado(item.estado), borderColor: colorEstado(item.estado) }]}>
                    {textoEstado(item.estado)}
                  </Text>
                </View>
                <Text style={s.date}>
                  {formatearFecha(item.fecha)}
                  {item.hora_inicio ? `  ·  ${formatearHora(item.hora_inicio)}` : ''}
                </Text>
                <Text style={s.meta}>
                  {paradas} {paradas === 1 ? 'parada' : 'paradas'}  ·  {formatearCOP(item.presupuesto)}  ·  {ETIQUETA_TRANSPORTE[item.modo_transporte as ModoTransporte] ?? 'A pie'}
                </Text>
                {item.publico && <Text style={s.public}>Público</Text>}
              </TouchableOpacity>
            )
          }}
        />
      )}

      <TouchableOpacity style={s.fab} onPress={nuevoPlan}>
        <Text style={s.fabText}>+ Nuevo plan</Text>
      </TouchableOpacity>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16 },
  back: { color: colors.primary, fontWeight: 'bold', width: 60 },
  title: { color: colors.text, fontSize: 22, fontWeight: 'bold' },
  tabs: { flexDirection: 'row', margin: 16, backgroundColor: colors.surface, borderRadius: 10, padding: 4 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  tabActive: { backgroundColor: colors.primary },
  tabText: { color: colors.textMuted, fontWeight: 'bold', fontSize: 13 },
  tabTextActive: { color: colors.text },
  card: { backgroundColor: colors.surface, borderRadius: 12, padding: 16 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  name: { color: colors.text, fontSize: 18, fontWeight: 'bold', flex: 1 },
  badge: { fontSize: 11, fontWeight: 'bold', borderWidth: 1, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  date: { color: colors.primary, fontSize: 14, fontWeight: 'bold', marginTop: 6 },
  meta: { color: colors.textMuted, fontSize: 13, marginTop: 4 },
  public: { color: colors.textMuted, fontSize: 12, marginTop: 6 },
  empty: { color: colors.textMuted, textAlign: 'center', marginTop: 48 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  errorText: { color: colors.danger, textAlign: 'center', marginBottom: 16 },
  retry: { backgroundColor: colors.primary, borderRadius: 8, paddingVertical: 12, paddingHorizontal: 24 },
  retryText: { color: colors.text, fontWeight: 'bold' },
  fab: {
    position: 'absolute', bottom: 24, left: 24, right: 24, backgroundColor: colors.primary,
    borderRadius: 12, padding: 16, alignItems: 'center',
  },
  fabText: { color: colors.text, fontSize: 16, fontWeight: 'bold' },
})