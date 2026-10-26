import { useCallback, useEffect, useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, RefreshControl } from 'react-native'
import { supabase } from '../../lib/supabase'
import { colors } from '../../theme/colors'
import { Negocio } from '../../types/admin'
import ReasonModal from '../../components/ReasonModal'

type Accion = { negocio: Negocio; tipo: 'reportar' | 'baja' }

export default function ActiveBusinessesTab() {
  const [items, setItems] = useState<Negocio[]>([])
  const [loading, setLoading] = useState(true)
  const [accion, setAccion] = useState<Accion | null>(null)
  const [busy, setBusy] = useState(false)

  const cargar = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('negocios').select('*').eq('estado', 'aprobado').order('nombre')
    if (error) Alert.alert('Error', error.message)
    else setItems(data as Negocio[])
    setLoading(false)
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const ejecutar = async (motivo: string) => {
    if (!accion) return
    setBusy(true)
    const fn = accion.tipo === 'baja' ? 'admin_dar_baja_negocio' : 'admin_reportar_negocio'
    const { error } = await supabase.rpc(fn, { p_id: accion.negocio.id_negocio, p_motivo: motivo })
    setBusy(false)
    if (error) return Alert.alert('Error', error.message)
    if (accion.tipo === 'baja') setItems(prev => prev.filter(x => x.id_negocio !== accion.negocio.id_negocio))
    else Alert.alert('Listo', 'El reporte quedó registrado.')
    setAccion(null)
  }

  return (
    <>
      <FlatList
        data={items}
        keyExtractor={i => String(i.id_negocio)}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={cargar} tintColor={colors.primary} />}
        ListEmptyComponent={!loading ? <Text style={s.empty}>Aún no hay negocios aprobados.</Text> : null}
        renderItem={({ item }) => (
          <View style={s.card}>
            <Text style={s.name}>{item.nombre}</Text>
            {!!item.direccion && <Text style={s.meta}>{item.direccion}</Text>}
            <View style={s.row}>
              <TouchableOpacity style={[s.btn, { backgroundColor: colors.warning }]} onPress={() => setAccion({ negocio: item, tipo: 'reportar' })}>
                <Text style={[s.btnText, { color: '#121212' }]}>Reportar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.btn, { backgroundColor: colors.danger }]} onPress={() => setAccion({ negocio: item, tipo: 'baja' })}>
                <Text style={s.btnText}>Dar de baja</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
      <ReasonModal
        visible={!!accion}
        title={accion?.tipo === 'baja' ? `Dar de baja "${accion?.negocio.nombre}"` : `Reportar "${accion?.negocio.nombre}"`}
        confirmLabel={accion?.tipo === 'baja' ? 'Dar de baja' : 'Reportar'}
        destructive={accion?.tipo === 'baja'}
        loading={busy}
        onCancel={() => setAccion(null)}
        onConfirm={ejecutar}
      />
    </>
  )
}

const s = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: 12, padding: 16 },
  name: { color: colors.text, fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  meta: { color: colors.textMuted, fontSize: 13, marginTop: 2 },
  row: { flexDirection: 'row', gap: 12, marginTop: 14 },
  btn: { flex: 1, borderRadius: 8, padding: 12, alignItems: 'center' },
  btnText: { color: colors.text, fontWeight: 'bold' },
  empty: { color: colors.textMuted, textAlign: 'center', marginTop: 48 },
})