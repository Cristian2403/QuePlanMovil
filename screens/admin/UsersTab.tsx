import { useCallback, useEffect, useState } from 'react'
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { supabase } from '../../lib/supabase'
import { colors } from '../../theme/colors'
import { UsuarioAdmin } from '../../types/admin'
import ReasonModal from '../../components/ReasonModal'

const DURACIONES: { label: string; dias: number | null }[] = [
  { label: '7 días', dias: 7 },
  { label: '30 días', dias: 30 },
  { label: 'Permanente', dias: null },
]

export default function UsersTab() {
  const [query, setQuery] = useState('')
  const [items, setItems] = useState<UsuarioAdmin[]>([])
  const [loading, setLoading] = useState(false)
  const [target, setTarget] = useState<UsuarioAdmin | null>(null)
  const [dias, setDias] = useState<number | null>(7)
  const [busy, setBusy] = useState(false)

  const buscar = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase.rpc('admin_listar_usuarios', { p_busqueda: query.trim() || null })
    if (error) Alert.alert('Error', error.message)
    else setItems((data ?? []) as UsuarioAdmin[])
    setLoading(false)
  }, [query])

  useEffect(() => {
    const id = setTimeout(buscar, 350)
    return () => clearTimeout(id)
  }, [buscar])

  const bloquear = async (motivo: string) => {
    if (!target) return
    setBusy(true)
    const hasta = dias ? new Date(Date.now() + dias * 86400000).toISOString() : null
    const { error } = await supabase.rpc('admin_bloquear_usuario', {
      p_id: target.id_usuario, p_motivo: motivo, p_hasta: hasta,
    })
    setBusy(false)
    if (error) return Alert.alert('Error', error.message)
    setTarget(null)
    buscar()
  }

  const desbloquear = (u: UsuarioAdmin) =>
    Alert.alert('Desbloquear', `¿Restablecer el acceso completo de ${u.nombre ?? u.email}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Desbloquear',
        onPress: async () => {
          const { error } = await supabase.rpc('admin_desbloquear_usuario', { p_id: u.id_usuario })
          if (error) Alert.alert('Error', error.message)
          else buscar()
        },
      },
    ])

  const estaBloqueado = (u: UsuarioAdmin) =>
    u.bloqueado && (!u.bloqueado_hasta || new Date(u.bloqueado_hasta) > new Date())

  return (
    <View style={{ flex: 1 }}>
      <TextInput
        style={s.search}
        placeholder="Buscar por nombre o correo"
        placeholderTextColor={colors.textMuted}
        value={query}
        onChangeText={setQuery}
        autoCapitalize="none"
      />
      <FlatList
        data={items}
        keyExtractor={i => i.id_usuario}
        refreshing={loading}
        onRefresh={buscar}
        contentContainerStyle={{ padding: 16, paddingTop: 4, gap: 12 }}
        ListEmptyComponent={!loading ? <Text style={s.empty}>No se encontraron usuarios.</Text> : null}
        renderItem={({ item }) => {
          const bloqueado = estaBloqueado(item)
          return (
            <View style={s.card}>
              <View style={{ flex: 1 }}>
                <Text style={s.name}>{item.nombre ?? 'Sin nombre'}</Text>
                <Text style={s.meta}>{item.email}  ·  {item.rol}</Text>
                {bloqueado && (
                  <Text style={s.blocked}>
                    Bloqueado{item.bloqueado_hasta ? ` hasta ${new Date(item.bloqueado_hasta).toLocaleDateString('es-CO')}` : ' (permanente)'}
                    {item.motivo_bloqueo ? `: ${item.motivo_bloqueo}` : ''}
                  </Text>
                )}
              </View>
              {bloqueado ? (
                <TouchableOpacity style={[s.btn, { backgroundColor: colors.success }]} onPress={() => desbloquear(item)}>
                  <Text style={s.btnText}>Desbloquear</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={[s.btn, { backgroundColor: colors.danger }]} onPress={() => { setDias(7); setTarget(item) }}>
                  <Text style={s.btnText}>Bloquear</Text>
                </TouchableOpacity>
              )}
            </View>
          )
        }}
      />

      <ReasonModal
        visible={!!target}
        title={`Bloquear a ${target?.nombre ?? target?.email ?? ''}`}
        confirmLabel="Bloquear"
        loading={busy}
        onCancel={() => setTarget(null)}
        onConfirm={bloquear}
      >
        <View style={s.chips}>
          {DURACIONES.map(d => (
            <TouchableOpacity key={d.label} style={[s.chip, dias === d.dias && s.chipActive]} onPress={() => setDias(d.dias)}>
              <Text style={[s.chipText, dias === d.dias && { color: colors.text }]}>{d.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ReasonModal>
    </View>
  )
}

const s = StyleSheet.create({
  search: { backgroundColor: colors.surface, color: colors.text, borderRadius: 8, padding: 14, margin: 16, fontSize: 16 },
  card: { backgroundColor: colors.surface, borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  name: { color: colors.text, fontSize: 16, fontWeight: 'bold' },
  meta: { color: colors.textMuted, fontSize: 13, marginTop: 2 },
  blocked: { color: colors.danger, fontSize: 12, marginTop: 6 },
  btn: { borderRadius: 8, paddingVertical: 10, paddingHorizontal: 14 },
  btnText: { color: colors.text, fontWeight: 'bold', fontSize: 13 },
  empty: { color: colors.textMuted, textAlign: 'center', marginTop: 48 },
  chips: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  chip: { backgroundColor: colors.background, borderRadius: 16, paddingVertical: 8, paddingHorizontal: 14 },
  chipActive: { backgroundColor: colors.primary },
  chipText: { color: colors.textMuted, fontWeight: 'bold', fontSize: 13 },
})