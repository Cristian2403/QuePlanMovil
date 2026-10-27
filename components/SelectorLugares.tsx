import { useCallback, useEffect, useMemo, useState } from 'react'
import { Modal, View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors } from '../theme/colors'
import { LugarMapa } from '../types/planes'
import { listarTodosLosLugares } from '../lib/lugaresApi'
import { formatearCOP } from '../lib/planesApi'

type Props = {
  visible: boolean
  onClose: () => void
  seleccionados: number[]
  onToggle: (l: LugarMapa) => void
}

export default function SelectorLugares({ visible, onClose, seleccionados, onToggle }: Props) {
  const insets = useSafeAreaInsets()
  const [lugares, setLugares] = useState<LugarMapa[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [q, setQ] = useState('')

  const cargar = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setLugares(await listarTodosLosLugares())
    } catch (e: any) {
      setError(e.message ?? 'No se pudieron cargar los lugares')
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    if (visible) { setQ(''); cargar() }
  }, [visible, cargar])

  const filtrados = useMemo(() => {
    const t = q.trim().toLowerCase()
    if (!t) return lugares
    return lugares.filter(l => l.nombre.toLowerCase().includes(t) || (l.categoria ?? '').toLowerCase().includes(t))
  }, [lugares, q])

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[s.container, { paddingTop: insets.top + 8, paddingBottom: insets.bottom }]}>
        <View style={s.header}>
          <Text style={s.title}>Agregar lugares</Text>
          <TouchableOpacity onPress={onClose}><Text style={s.done}>Listo</Text></TouchableOpacity>
        </View>

        <TextInput
          style={s.search}
          placeholder="Buscar por nombre o categoría"
          placeholderTextColor={colors.textMuted}
          value={q}
          onChangeText={setQ}
        />

        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 32 }} />
        ) : error ? (
          <TouchableOpacity onPress={cargar}>
            <Text style={s.error}>{error} · Toca para reintentar</Text>
          </TouchableOpacity>
        ) : (
          <FlatList
            data={filtrados}
            keyExtractor={l => String(l.id_lugar)}
            contentContainerStyle={{ padding: 16, gap: 10 }}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={<Text style={s.empty}>No se encontraron lugares.</Text>}
            renderItem={({ item }) => {
              const en = seleccionados.includes(item.id_lugar)
              return (
                <TouchableOpacity style={[s.row, en && s.rowOn]} onPress={() => onToggle(item)}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.name}>{item.nombre}</Text>
                    <Text style={s.meta}>
                      {[item.categoria, item.negocio_nombre].filter(Boolean).join('  ·  ') || 'Sin categoría'}
                    </Text>
                    <Text style={s.meta}>
                      {item.precio_promedio === null ? 'Precio no indicado'
                        : item.precio_promedio === 0 ? 'Gratis' : formatearCOP(item.precio_promedio)}
                    </Text>
                  </View>
                  <Text style={[s.mark, en && { color: colors.success }]}>{en ? '✓' : '＋'}</Text>
                </TouchableOpacity>
              )
            }}
          />
        )}
      </View>
    </Modal>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16 },
  title: { color: colors.text, fontSize: 22, fontWeight: 'bold' },
  done: { color: colors.primary, fontWeight: 'bold', fontSize: 16 },
  search: { backgroundColor: colors.surface, color: colors.text, borderRadius: 8, padding: 14, margin: 16, marginBottom: 0, fontSize: 16 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 10, padding: 14, gap: 12 },
  rowOn: { borderWidth: 1, borderColor: colors.success },
  name: { color: colors.text, fontSize: 16, fontWeight: 'bold' },
  meta: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  mark: { color: colors.primary, fontSize: 24, fontWeight: 'bold', width: 28, textAlign: 'center' },
  empty: { color: colors.textMuted, textAlign: 'center', marginTop: 32 },
  error: { color: colors.danger, textAlign: 'center', marginTop: 32, paddingHorizontal: 24 },
})