import { useEffect, useMemo, useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, Switch,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { RootStackParamList } from '../../navigation/AppNavigator'
import { colors } from '../../theme/colors'
import { LugarMapa, ModoTransporte } from '../../types/planes'
import { usePlanBorrador } from '../../context/PlanBorradorContext'
import {
  guardarPlan, obtenerPlan, aISO, hoyISO, formatearFecha, formatearCOP, ETIQUETA_TRANSPORTE,
} from '../../lib/planesApi'
import SelectorLugares from '../../components/SelectorLugares'

type Props = NativeStackScreenProps<RootStackParamList, 'CrearPlan'>
type Cuando = 'hoy' | 'manana' | 'otro'

const MODOS = Object.keys(ETIQUETA_TRANSPORTE) as ModoTransporte[]
const HORA_RE = /^([01]?\d|2[0-3]):([0-5]\d)$/

const diaDesdeHoy = (n: number) => {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return aISO(d)
}
const DIAS_OTROS = Array.from({ length: 14 }, (_, i) => diaDesdeHoy(i + 2))

const normalizarHora = (h: string): string | null => {
  const m = h.match(HORA_RE)
  return m ? `${m[1].padStart(2, '0')}:${m[2]}` : null
}

export default function CrearPlanScreen({ navigation, route }: Props) {
  const idPlan = route.params?.idPlan ?? null
  const editando = idPlan !== null
  const insets = useSafeAreaInsets()
  const { paradas, agregar, quitar, mover, reemplazar, limpiar, estaEnPlan } = usePlanBorrador()

  const [nombre, setNombre] = useState('')
  const [cuando, setCuando] = useState<Cuando>('hoy')
  const [otroDia, setOtroDia] = useState<string | null>(null)
  const [hora, setHora] = useState('')
  const [presupuesto, setPresupuesto] = useState('')
  const [modo, setModo] = useState<ModoTransporte>('a_pie')
  const [publico, setPublico] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [cargando, setCargando] = useState(editando)
  const [selectorAbierto, setSelectorAbierto] = useState(false)

  // Modo edición: carga el plan y sus paradas
  useEffect(() => {
    if (idPlan === null) return
    let activo = true
    ;(async () => {
      try {
        const p = await obtenerPlan(idPlan)
        if (!activo) return
        setNombre(p.nombre)
        if (p.fecha === diaDesdeHoy(0)) setCuando('hoy')
        else if (p.fecha === diaDesdeHoy(1)) setCuando('manana')
        else { setCuando('otro'); setOtroDia(p.fecha) }
        setHora(p.hora_inicio ? p.hora_inicio.slice(0, 5) : '')
        setPresupuesto(p.presupuesto !== null ? String(Math.round(Number(p.presupuesto))) : '')
        setModo((p.modo_transporte as ModoTransporte) ?? 'a_pie')
        setPublico(p.publico)
        reemplazar(
          p.plan_lugares
            .filter(x => x.lugares)
            .map(x => ({
              id_lugar: x.lugares!.id_lugar,
              nombre: x.lugares!.nombre,
              categoria: x.lugares!.categoria,
              precio_promedio: x.lugares!.precio_promedio,
              latitud: x.lugares!.latitud,
              longitud: x.lugares!.longitud,
            }))
        )
      } catch (e: any) {
        if (activo) Alert.alert('No se pudo cargar el plan', e.message ?? '', [{ text: 'Volver', onPress: () => navigation.goBack() }])
      } finally {
        if (activo) setCargando(false)
      }
    })()
    return () => { activo = false }
  }, [idPlan])

  // Al salir del modo edición se descartan las paradas cargadas, para no contaminar un plan nuevo
  useEffect(() => () => { if (idPlan !== null) limpiar() }, [])

  const fecha = cuando === 'hoy' ? diaDesdeHoy(0) : cuando === 'manana' ? diaDesdeHoy(1) : otroDia
  const presupuestoNum = presupuesto ? Number(presupuesto) : null
  const opcionesOtros = otroDia && !DIAS_OTROS.includes(otroDia) ? [otroDia, ...DIAS_OTROS] : DIAS_OTROS

  const { costo, sinPrecio } = useMemo(() => ({
    costo: paradas.reduce((t, p) => t + (p.precio_promedio ?? 0), 0),
    sinPrecio: paradas.filter(p => p.precio_promedio === null).length,
  }), [paradas])
  const excede = presupuestoNum !== null && costo > presupuestoNum

  const alternarLugar = (l: LugarMapa) => {
    if (estaEnPlan(l.id_lugar)) return quitar(l.id_lugar)
    const ok = agregar({
      id_lugar: l.id_lugar, nombre: l.nombre, categoria: l.categoria,
      precio_promedio: l.precio_promedio, latitud: l.latitud, longitud: l.longitud,
    })
    if (!ok) Alert.alert('Límite alcanzado', 'Un plan puede tener hasta 10 paradas.')
  }

  const guardar = async (estado: 'borrador' | 'activo') => {
    if (nombre.trim().length < 3)
      return Alert.alert('Falta el nombre', 'Ponle un nombre de al menos 3 letras a tu plan.')

    const horaTxt = hora.trim()
    const horaOk = horaTxt ? normalizarHora(horaTxt) : null
    if (horaTxt && !horaOk)
      return Alert.alert('Hora inválida', 'Usa formato de 24 horas, por ejemplo 14:30.')

    if (estado === 'activo') {
      if (!fecha) return Alert.alert('Falta la fecha', 'Elige qué día será tu plan.')
      if (fecha < hoyISO()) return Alert.alert('Fecha pasada', 'Elige hoy o un día futuro.')
      if (paradas.length === 0)
        return Alert.alert('Faltan lugares', 'Agrega al menos un lugar a tu plan.')
      if (fecha === hoyISO() && horaOk) {
        const ahora = new Date()
        const [h, m] = horaOk.split(':').map(Number)
        if (h * 60 + m < ahora.getHours() * 60 + ahora.getMinutes())
          return Alert.alert('Hora pasada', 'Esa hora ya pasó. Elige otra o agenda para otro día.')
      }
    }

    setGuardando(true)
    try {
      await guardarPlan({
        id_plan: idPlan,
        nombre: nombre.trim(),
        fecha,
        hora_inicio: horaOk,
        presupuesto: presupuestoNum,
        modo_transporte: modo,
        publico,
        estado,
        lugares: paradas.map(p => p.id_lugar),
      })
      limpiar()
      if (editando) navigation.goBack()          // vuelve al detalle, que se recarga solo
      else navigation.popTo('MisPlanes')         // vuelve a Mis planes sin duplicar la pantalla
    } catch (e: any) {
      Alert.alert('No se pudo guardar', e.message ?? 'Intenta de nuevo.')
    } finally {
      setGuardando(false)
    }
  }

  const Chip = ({ label, activo, onPress }: { label: string; activo: boolean; onPress: () => void }) => (
    <TouchableOpacity style={[s.chip, activo && s.chipActive]} onPress={onPress}>
      <Text style={[s.chipText, activo && { color: colors.text }]}>{label}</Text>
    </TouchableOpacity>
  )

  if (cargando) {
    return (
      <View style={[s.container, { justifyContent: 'center' }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    )
  }

  return (
    <KeyboardAvoidingView style={[s.container, { paddingTop: insets.top }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={s.back}>‹ Volver</Text></TouchableOpacity>
        <Text style={s.title}>{editando ? 'Editar plan' : 'Crear plan'}</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
        <Text style={s.label}>Nombre del plan</Text>
        <TextInput style={s.input} placeholder="Ej: Tarde en Laureles" placeholderTextColor={colors.textMuted}
          value={nombre} onChangeText={setNombre} maxLength={60} />

        <Text style={s.label}>¿Cuándo?</Text>
        <View style={s.row}>
          <Chip label="Hoy" activo={cuando === 'hoy'} onPress={() => setCuando('hoy')} />
          <Chip label="Mañana" activo={cuando === 'manana'} onPress={() => setCuando('manana')} />
          <Chip label="Otro día" activo={cuando === 'otro'} onPress={() => setCuando('otro')} />
        </View>
        {cuando === 'otro' && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[s.row, { marginTop: 10 }]}>
            {opcionesOtros.map(d => (
              <Chip key={d} label={formatearFecha(d)} activo={otroDia === d} onPress={() => setOtroDia(d)} />
            ))}
          </ScrollView>
        )}

        <Text style={s.label}>Hora de inicio (opcional)</Text>
        <TextInput style={s.input} placeholder="14:30" placeholderTextColor={colors.textMuted}
          value={hora} onChangeText={setHora} keyboardType="numbers-and-punctuation" maxLength={5} />

        <Text style={s.label}>Presupuesto por persona (COP, opcional)</Text>
        <TextInput style={s.input} placeholder="50000" placeholderTextColor={colors.textMuted}
          value={presupuesto} onChangeText={t => setPresupuesto(t.replace(/\D/g, ''))}
          keyboardType="number-pad" maxLength={9} />

        <Text style={s.label}>¿Cómo te vas a mover?</Text>
        <View style={[s.row, { flexWrap: 'wrap' }]}>
          {MODOS.map(m => <Chip key={m} label={ETIQUETA_TRANSPORTE[m]} activo={modo === m} onPress={() => setModo(m)} />)}
        </View>

        <View style={s.switchRow}>
          <View style={{ flex: 1 }}>
            <Text style={s.switchTitle}>Plan público</Text>
            <Text style={s.hint}>Otros usuarios podrán verlo en Explorar planes.</Text>
          </View>
          <Switch value={publico} onValueChange={setPublico} trackColor={{ true: colors.primary }} />
        </View>

        <Text style={s.label}>Paradas ({paradas.length})</Text>
        {paradas.length === 0 && (
          <Text style={s.hint}>Aún no hay lugares. Pulsa "Agregar lugares" o elígelos desde el mapa.</Text>
        )}
        {paradas.map((p, i) => (
          <View key={p.id_lugar} style={s.parada}>
            <Text style={s.num}>{i + 1}</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.paradaName} numberOfLines={1}>{p.nombre}</Text>
              <Text style={s.hint}>
                {p.precio_promedio === null ? 'Precio no indicado' : p.precio_promedio === 0 ? 'Gratis' : formatearCOP(p.precio_promedio)}
              </Text>
            </View>
            <TouchableOpacity hitSlop={8} onPress={() => mover(i, -1)}><Text style={s.icon}>↑</Text></TouchableOpacity>
            <TouchableOpacity hitSlop={8} onPress={() => mover(i, 1)}><Text style={s.icon}>↓</Text></TouchableOpacity>
            <TouchableOpacity hitSlop={8} onPress={() => quitar(p.id_lugar)}><Text style={[s.icon, { color: colors.danger }]}>✕</Text></TouchableOpacity>
          </View>
        ))}
        <TouchableOpacity style={s.addMore} onPress={() => setSelectorAbierto(true)}>
          <Text style={s.addMoreText}>＋ Agregar lugares</Text>
        </TouchableOpacity>

        {paradas.length > 0 && (
          <View style={s.resumen}>
            <Text style={s.resumenText}>Costo estimado por persona: {formatearCOP(costo)}</Text>
            {sinPrecio > 0 && <Text style={s.hint}>{sinPrecio} {sinPrecio === 1 ? 'lugar no tiene' : 'lugares no tienen'} precio indicado.</Text>}
            {excede && <Text style={s.warn}>Supera tu presupuesto de {formatearCOP(presupuestoNum)}.</Text>}
          </View>
        )}
      </ScrollView>

      <View style={[s.footer, { paddingBottom: 12 + insets.bottom }]}>
        <TouchableOpacity style={[s.btn, s.btnGhost, guardando && { opacity: 0.5 }]} disabled={guardando} onPress={() => guardar('borrador')}>
          <Text style={s.btnGhostText}>{editando ? 'Guardar como borrador' : 'Guardar borrador'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.btn, guardando && { opacity: 0.5 }]} disabled={guardando} onPress={() => guardar('activo')}>
          <Text style={s.btnText}>{guardando ? 'Guardando…' : editando ? 'Guardar y confirmar' : 'Confirmar plan'}</Text>
        </TouchableOpacity>
      </View>

      <SelectorLugares
        visible={selectorAbierto}
        onClose={() => setSelectorAbierto(false)}
        seleccionados={paradas.map(p => p.id_lugar)}
        onToggle={alternarLugar}
      />
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12 },
  back: { color: colors.primary, fontWeight: 'bold', width: 60 },
  title: { color: colors.text, fontSize: 22, fontWeight: 'bold' },
  label: { color: colors.text, fontWeight: 'bold', fontSize: 14, marginTop: 20, marginBottom: 8 },
  input: { backgroundColor: colors.surface, color: colors.text, borderRadius: 8, padding: 14, fontSize: 16 },
  row: { flexDirection: 'row', gap: 8 },
  chip: { backgroundColor: colors.surface, borderRadius: 16, paddingVertical: 8, paddingHorizontal: 14 },
  chipActive: { backgroundColor: colors.primary },
  chipText: { color: colors.textMuted, fontWeight: 'bold', fontSize: 13 },
  switchRow: { flexDirection: 'row', alignItems: 'center', marginTop: 20, backgroundColor: colors.surface, borderRadius: 10, padding: 14, gap: 12 },
  switchTitle: { color: colors.text, fontWeight: 'bold', fontSize: 15 },
  hint: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  parada: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 10, padding: 12, marginBottom: 8, gap: 12 },
  num: { color: colors.primary, fontWeight: 'bold', fontSize: 16, width: 20, textAlign: 'center' },
  paradaName: { color: colors.text, fontSize: 15, fontWeight: 'bold' },
  icon: { color: colors.text, fontSize: 20, paddingHorizontal: 4 },
  addMore: { borderWidth: 1, borderColor: colors.primary, borderStyle: 'dashed', borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 4 },
  addMoreText: { color: colors.primary, fontWeight: 'bold' },
  resumen: { marginTop: 16, backgroundColor: colors.surface, borderRadius: 10, padding: 14 },
  resumenText: { color: colors.text, fontWeight: 'bold', fontSize: 15 },
  warn: { color: colors.warning, fontWeight: 'bold', marginTop: 6 },
  footer: { flexDirection: 'row', gap: 12, padding: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, backgroundColor: colors.background },
  btn: { flex: 1, backgroundColor: colors.primary, borderRadius: 10, padding: 15, alignItems: 'center' },
  btnText: { color: colors.text, fontWeight: 'bold', fontSize: 15 },
  btnGhost: { backgroundColor: colors.surface },
  btnGhostText: { color: colors.text, fontWeight: 'bold', fontSize: 15 },
})