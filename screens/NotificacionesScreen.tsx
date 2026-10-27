import { useCallback, useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { RootStackParamList } from '../navigation/AppNavigator'
import { colors } from '../theme/colors'
import { Notificacion } from '../types/social'
import { listarNotificaciones, marcarLeidas } from '../lib/notificacionesApi'
import { hace } from '../lib/tiempo'

type Props = NativeStackScreenProps<RootStackParamList, 'Notificaciones'>

export default function NotificacionesScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets()
  const [items, setItems] = useState<Notificacion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const cargar = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setItems(await listarNotificaciones())
    } catch (e: any) {
      setError(e.message ?? 'No se pudieron cargar las notificaciones')
    }
    setLoading(false)
  }, [])

  useFocusEffect(useCallback(() => { cargar() }, [cargar]))

  const marcar = async (n: Notificacion) => {
    if (n.leida) return
    setItems(prev => prev.map(x => (x.id_notificacion === n.id_notificacion ? { ...x, leida: true } : x)))
    try { await marcarLeidas([n.id_notificacion]) } catch { cargar() }
  }

  const marcarTodas = async () => {
    setItems(prev => prev.map(x => ({ ...x, leida: true })))
    try { await marcarLeidas(null) } catch { cargar() }
  }

  const hayNoLeidas = items.some(n => !n.leida)

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={s.back}>‹ Volver</Text></TouchableOpacity>
        <Text style={s.title}>Notificaciones</Text>
        <View style={{ width: 70 }} />
      </View>

      {hayNoLeidas && (
        <TouchableOpacity onPress={marcarTodas} style={s.markAll}>
          <Text style={s.markAllText}>Marcar todas como leídas</Text>
        </TouchableOpacity>
      )}

      {error ? (
        <TouchableOpacity onPress={cargar}>
          <Text style={s.error}>{error} · Toca para reintentar</Text>
        </TouchableOpacity>
      ) : (
        <FlatList
          data={items}
          keyExtractor={n => String(n.id_notificacion)}
          contentContainerStyle={{ padding: 16, paddingBottom: 24 + insets.bottom, gap: 10 }}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={cargar} tintColor={colors.primary} />}
          ListEmptyComponent={!loading ? <Text style={s.empty}>No tienes notificaciones.</Text> : null}
          renderItem={({ item }) => (
            <TouchableOpacity style={[s.card, !item.leida && s.cardNew]} onPress={() => marcar(item)} activeOpacity={0.8}>
              {!item.leida && <View style={s.dot} />}
              <View style={{ flex: 1 }}>
                <Text style={[s.msg, !item.leida && { fontWeight: 'bold' }]}>{item.mensaje}</Text>
                <Text style={s.time}>{hace(item.fecha)}</Text>
              </View>
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
  markAll: { alignSelf: 'flex-end', paddingHorizontal: 16, paddingTop: 12 },
  markAllText: { color: colors.primary, fontWeight: 'bold', fontSize: 13 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface, borderRadius: 12, padding: 14 },
  cardNew: { borderLeftWidth: 4, borderLeftColor: colors.primary },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  msg: { color: colors.text, fontSize: 14 },
  time: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
  empty: { color: colors.textMuted, textAlign: 'center', marginTop: 48 },
  error: { color: colors.danger, textAlign: 'center', margin: 24 },
})