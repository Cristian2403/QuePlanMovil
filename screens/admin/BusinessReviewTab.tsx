import { useCallback, useEffect, useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, RefreshControl } from 'react-native'
import { supabase } from '../../lib/supabase'
import { colors } from '../../theme/colors'
import { Negocio } from '../../types/admin'
import ReasonModal from '../../components/ReasonModal'

export default function BusinessReviewTab() {
  const [items, setItems] = useState<Negocio[]>([])
  const [loading, setLoading] = useState(true)
  const [rejecting, setRejecting] = useState<Negocio | null>(null)
  const [busy, setBusy] = useState(false)

  const cargar = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('negocios').select('*').eq('estado', 'pendiente')
      .order('creado_en', { ascending: true })
    if (error) Alert.alert('Error', error.message)
    else setItems(data as Negocio[])
    setLoading(false)
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const revisar = async (n: Negocio, decision: 'aprobar' | 'rechazar', motivo?: string) => {
    setBusy(true)
    const { error } = await supabase.rpc('admin_revisar_negocio', {
      p_id: n.id_negocio, p_decision: decision, p_motivo: motivo ?? null,
    })
    setBusy(false)
    if (error) return Alert.alert('Error', error.message)
    setRejecting(null)
    setItems(prev => prev.filter(x => x.id_negocio !== n.id_negocio))
  }

  const confirmarAprobacion = (n: Negocio) =>
    Alert.alert('Aprobar negocio', `¿Aprobar "${n.nombre}"? Será visible para todos los usuarios.`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Aprobar', onPress: () => revisar(n, 'aprobar') },
    ])

  return (
    <>
      <FlatList
        data={items}
        keyExtractor={i => String(i.id_negocio)}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={cargar} tintColor={colors.primary} />}
        ListEmptyComponent={!loading ? <Text style={s.empty}>No hay negocios esperando verificación.</Text> : null}
        renderItem={({ item }) => (
          <View style={s.card}>
            <Text style={s.name}>{item.nombre}</Text>
            {!!item.direccion && <Text style={s.meta}>{item.direccion}</Text>}
            {!!item.telefono && <Text style={s.meta}>{item.telefono}</Text>}
            {!!item.descripcion && <Text style={s.desc}>{item.descripcion}</Text>}
            <Text style={s.meta}>Documentos adjuntos: {item.documentos?.length ?? 0}</Text>
            <Text style={s.meta}>Registrado: {new Date(item.creado_en).toLocaleDateString('es-CO')}</Text>
            <View style={s.row}>
              <TouchableOpacity style={[s.btn, { backgroundColor: colors.danger }]} onPress={() => setRejecting(item)}>
                <Text style={s.btnText}>Rechazar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.btn, { backgroundColor: colors.success }]} onPress={() => confirmarAprobacion(item)}>
                <Text style={s.btnText}>Aprobar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
      <ReasonModal
        visible={!!rejecting}
        title={`Rechazar "${rejecting?.nombre}"`}
        confirmLabel="Rechazar"
        loading={busy}
        onCancel={() => setRejecting(null)}
        onConfirm={m => rejecting && revisar(rejecting, 'rechazar', m)}
      />
    </>
  )
}

const s = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: 12, padding: 16 },
  name: { color: colors.text, fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  meta: { color: colors.textMuted, fontSize: 13, marginTop: 2 },
  desc: { color: colors.text, fontSize: 14, marginTop: 8, marginBottom: 4 },
  row: { flexDirection: 'row', gap: 12, marginTop: 14 },
  btn: { flex: 1, borderRadius: 8, padding: 12, alignItems: 'center' },
  btnText: { color: colors.text, fontWeight: 'bold' },
  empty: { color: colors.textMuted, textAlign: 'center', marginTop: 48 },
})