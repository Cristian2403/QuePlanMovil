import { useCallback, useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { RootStackParamList } from '../../navigation/AppNavigator'
import { supabase } from '../../lib/supabase'
import { colors } from '../../theme/colors'
import { ModoTransporte, PlanDetalle } from '../../types/planes'
import { usePlanBorrador } from '../../context/PlanBorradorContext'
import { listarTodosLosLugares } from '../../lib/lugaresApi'
import { copiarPlan } from '../../lib/explorarApi'
import {
  obtenerPlan, eliminarPlan, formatearFecha, formatearHora, formatearCOP, ETIQUETA_TRANSPORTE,
} from '../../lib/planesApi'

type Props = NativeStackScreenProps<RootStackParamList, 'PlanDetalle'>

export default function PlanDetalleScreen({ navigation, route }: Props) {
  const { idPlan } = route.params
  const insets = useSafeAreaInsets()
  const { paradas: borrador } = usePlanBorrador()

  const [plan, setPlan] = useState<PlanDetalle | null>(null)
  const [esMio, setEsMio] = useState(false)
  const [noDisponibles, setNoDisponibles] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [borrando, setBorrando] = useState(false)

  const cargar = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [p, sesion, disponibles] = await Promise.all([
        obtenerPlan(idPlan),
        supabase.auth.getSession(),
        listarTodosLosLugares(),
      ])
      const ids = new Set(disponibles.map(l => l.id_lugar))
      setNoDisponibles(new Set(
        p.plan_lugares.filter(x => x.lugares && !ids.has(x.lugares.id_lugar)).map(x => x.lugares!.id_lugar)
      ))
      setEsMio(sesion.data.session?.user.id === p.id_usuario)
      setPlan(p)
    } catch (e: any) {
      setError(e.message ?? 'No se pudo cargar el plan')
    }
    setLoading(false)
  }, [idPlan])

  // Se recarga al volver de editar
  useFocusEffect(useCallback(() => { cargar() }, [cargar]))

  const editar = () => {
    const ir = () => navigation.navigate('CrearPlan', { idPlan })
    if (borrador.length > 0) {
      Alert.alert(
        'Reemplazar borrador',
        'Tienes un plan nuevo sin guardar en el mapa. Si editas este plan, ese borrador se descartará.',
        [{ text: 'Cancelar', style: 'cancel' }, { text: 'Continuar', onPress: ir }]
      )
    } else {
      ir()
    }
  }

  const eliminar = () => {
    if (!plan) return
    Alert.alert('Eliminar plan', `¿Eliminar "${plan.nombre}"? Esta acción no se puede deshacer.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive',
        onPress: async () => {
          setBorrando(true)
          try {
            await eliminarPlan(plan.id_plan)
            navigation.goBack()
          } catch (e: any) {
            setBorrando(false)
            Alert.alert('No se pudo eliminar', e.message ?? 'Intenta de nuevo.')
          }
        },
      },
    ])
  }

    const copiar = async () => {
    try {
      const nuevo = await copiarPlan(idPlan)
      Alert.alert(
        'Plan copiado',
        'Lo guardamos en tus planes como borrador. Elige tu fecha y confírmalo cuando quieras.',
        [{ text: 'Ver mi copia', onPress: () => navigation.replace('PlanDetalle', { idPlan: nuevo }) }]
      )
    } catch (e: any) {
      Alert.alert('No se pudo copiar', e.message ?? 'Intenta de nuevo.')
    }
  }

  const header = (
    <View style={s.header}>
      <TouchableOpacity onPress={() => navigation.goBack()}><Text style={s.back}>‹ Volver</Text></TouchableOpacity>
      <Text style={s.title}>Detalle del plan</Text>
      <View style={{ width: 60 }} />
    </View>
  )

  if (loading && !plan) {
    return (
      <View style={[s.container, { paddingTop: insets.top }]}>
        {header}
        <ActivityIndicator color={colors.primary} style={{ marginTop: 48 }} />
      </View>
    )
  }

  if (error || !plan) {
    return (
      <View style={[s.container, { paddingTop: insets.top }]}>
        {header}
        <Text style={s.error}>{error ?? 'Plan no encontrado'}</Text>
        <TouchableOpacity style={s.retry} onPress={cargar}><Text style={s.retryText}>Reintentar</Text></TouchableOpacity>
      </View>
    )
  }

  const costo = plan.plan_lugares.reduce((t, x) => t + (x.lugares?.precio_promedio ?? 0), 0)
  const editable = esMio && plan.estado !== 'completado' && plan.estado !== 'cancelado'
  const colorEstado = plan.estado === 'activo' ? colors.success : plan.estado === 'borrador' ? colors.warning : colors.textMuted
  const textoEstado = plan.estado === 'activo' ? 'Confirmado' : plan.estado === 'borrador' ? 'Borrador'
    : plan.estado === 'completado' ? 'Completado' : plan.estado === 'cancelado' ? 'Cancelado' : (plan.estado ?? '')

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      {header}
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
        <View style={s.card}>
          <View style={s.cardTop}>
            <Text style={s.name}>{plan.nombre}</Text>
            <Text style={[s.badge, { color: colorEstado, borderColor: colorEstado }]}>{textoEstado}</Text>
          </View>
          <Text style={s.date}>
            {formatearFecha(plan.fecha)}{plan.hora_inicio ? `  ·  ${formatearHora(plan.hora_inicio)}` : ''}
          </Text>
          <Text style={s.meta}>Transporte: {ETIQUETA_TRANSPORTE[plan.modo_transporte as ModoTransporte] ?? 'A pie'}</Text>
          <Text style={s.meta}>Presupuesto: {formatearCOP(plan.presupuesto)}</Text>
          <Text style={s.meta}>Costo estimado por persona: {formatearCOP(costo)}</Text>
          <Text style={s.meta}>{plan.publico ? 'Plan público' : 'Plan privado'}</Text>
        </View>

        {esMio && noDisponibles.size > 0 && (
          <View style={s.alertBox}>
            <Text style={s.alertText}>
              {noDisponibles.size === 1 ? 'Un lugar de este plan ya no está disponible.' : `${noDisponibles.size} lugares de este plan ya no están disponibles.`}
              {' '}Edita el plan para quitarlos antes de guardarlo.
            </Text>
          </View>
        )}

        <Text style={s.label}>Paradas ({plan.plan_lugares.length})</Text>
        {plan.plan_lugares.length === 0 && <Text style={s.meta}>Este plan aún no tiene paradas.</Text>}
        {plan.plan_lugares.map((x, i) => (
          <View key={`${x.lugares?.id_lugar ?? 'sin'}-${i}`} style={s.parada}>
            <Text style={s.num}>{i + 1}</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.paradaName}>{x.lugares?.nombre ?? 'Lugar no disponible'}</Text>
              {!!x.lugares?.categoria && <Text style={s.meta}>{x.lugares.categoria}</Text>}
              <Text style={s.meta}>
                {!x.lugares || x.lugares.precio_promedio === null ? 'Precio no indicado'
                  : x.lugares.precio_promedio === 0 ? 'Gratis' : formatearCOP(x.lugares.precio_promedio)}
              </Text>
              {x.lugares && noDisponibles.has(x.lugares.id_lugar) && <Text style={s.unavailable}>No disponible</Text>}
            </View>
          </View>
        ))}
      </ScrollView>

      {editable && (
        <View style={[s.footer, { paddingBottom: 12 + insets.bottom }]}>
          <TouchableOpacity style={[s.btn, s.btnDanger, borrando && { opacity: 0.5 }]} disabled={borrando} onPress={eliminar}>
            <Text style={s.btnText}>{borrando ? 'Eliminando…' : 'Eliminar'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.btn, borrando && { opacity: 0.5 }]} disabled={borrando} onPress={editar}>
            <Text style={s.btnText}>Editar</Text>
          </TouchableOpacity>
        </View>
      )}

            {!esMio && (
        <View style={[s.footer, { paddingBottom: 12 + insets.bottom }]}>
          <TouchableOpacity style={s.btn} onPress={copiar}>
            <Text style={s.btnText}>Copiar a mis planes</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12 },
  back: { color: colors.primary, fontWeight: 'bold', width: 60 },
  title: { color: colors.text, fontSize: 20, fontWeight: 'bold' },
  card: { backgroundColor: colors.surface, borderRadius: 12, padding: 16 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  name: { color: colors.text, fontSize: 20, fontWeight: 'bold', flex: 1 },
  badge: { fontSize: 11, fontWeight: 'bold', borderWidth: 1, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  date: { color: colors.primary, fontSize: 15, fontWeight: 'bold', marginTop: 8 },
  meta: { color: colors.textMuted, fontSize: 13, marginTop: 3 },
  label: { color: colors.text, fontWeight: 'bold', fontSize: 14, marginTop: 20, marginBottom: 8 },
  parada: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 10, padding: 14, marginBottom: 8, gap: 12 },
  num: { color: colors.primary, fontWeight: 'bold', fontSize: 16, width: 20, textAlign: 'center' },
  paradaName: { color: colors.text, fontSize: 16, fontWeight: 'bold' },
  unavailable: { color: colors.danger, fontSize: 12, fontWeight: 'bold', marginTop: 4 },
  alertBox: { backgroundColor: colors.surface, borderLeftWidth: 4, borderLeftColor: colors.warning, borderRadius: 8, padding: 12, marginTop: 12 },
  alertText: { color: colors.text, fontSize: 13 },
  error: { color: colors.danger, textAlign: 'center', margin: 24 },
  retry: { alignSelf: 'center', backgroundColor: colors.primary, borderRadius: 8, paddingVertical: 12, paddingHorizontal: 24 },
  retryText: { color: colors.text, fontWeight: 'bold' },
  footer: { flexDirection: 'row', gap: 12, padding: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, backgroundColor: colors.background },
  btn: { flex: 1, backgroundColor: colors.primary, borderRadius: 10, padding: 15, alignItems: 'center' },
  btnDanger: { backgroundColor: colors.danger },
  btnText: { color: colors.text, fontWeight: 'bold', fontSize: 15 },
})