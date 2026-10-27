import { useCallback, useState } from 'react'
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, Modal, TextInput, Alert,
} from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { RootStackParamList } from '../../navigation/AppNavigator'
import { colors } from '../../theme/colors'
import { Foro } from '../../types/social'
import { listarForos, crearForo } from '../../lib/foroApi'
import { hace } from '../../lib/tiempo'

type Props = NativeStackScreenProps<RootStackParamList, 'Foros'>

export default function ForosScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets()
  const [foros, setForos] = useState<Foro[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modal, setModal] = useState(false)
  const [titulo, setTitulo] = useState('')
  const [desc, setDesc] = useState('')
  const [enviando, setEnviando] = useState(false)

  const cargar = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setForos(await listarForos())
    } catch (e: any) {
      setError(e.message ?? 'No se pudieron cargar los foros')
    }
    setLoading(false)
  }, [])

  useFocusEffect(useCallback(() => { cargar() }, [cargar]))

  const publicar = async () => {
    if (titulo.trim().length < 3) return Alert.alert('Falta el título', 'Escribe al menos 3 letras.')
    setEnviando(true)
    try {
      const id = await crearForo(titulo.trim(), desc.trim() || null)
      setModal(false)
      setTitulo('')
      setDesc('')
      navigation.navigate('ForoDetalle', { idForo: id })
    } catch (e: any) {
      Alert.alert('No se pudo publicar', e.message ?? 'Intenta de nuevo.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={s.back}>‹ Volver</Text></TouchableOpacity>
        <Text style={s.title}>Foro</Text>
        <View style={{ width: 70 }} />
      </View>

      {error ? (
        <TouchableOpacity onPress={cargar}>
          <Text style={s.error}>{error} · Toca para reintentar</Text>
        </TouchableOpacity>
      ) : (
        <FlatList
          data={foros}
          keyExtractor={f => String(f.id_foro)}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 + insets.bottom, gap: 12 }}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={cargar} tintColor={colors.primary} />}
          ListEmptyComponent={!loading ? <Text style={s.empty}>Aún no hay foros. ¡Abre el primero!</Text> : null}
          renderItem={({ item }) => (
            <TouchableOpacity style={s.card} activeOpacity={0.8} onPress={() => navigation.navigate('ForoDetalle', { idForo: item.id_foro })}>
              <Text style={s.name} numberOfLines={2}>{item.titulo}</Text>
              {!!item.descripcion && <Text style={s.desc} numberOfLines={2}>{item.descripcion}</Text>}
              <Text style={s.meta}>
                por {item.autor}  ·  {item.num_comentarios} {item.num_comentarios === 1 ? 'comentario' : 'comentarios'}  ·  {hace(item.ultima_actividad)}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}

      <TouchableOpacity style={[s.fab, { bottom: 24 + insets.bottom }]} onPress={() => setModal(true)}>
        <Text style={s.fabText}>+ Nuevo foro</Text>
      </TouchableOpacity>

      <Modal visible={modal} transparent animationType="fade" onRequestClose={() => setModal(false)}>
        <View style={s.backdrop}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>Nuevo foro</Text>
            <TextInput style={s.input} placeholder="Título" placeholderTextColor={colors.textMuted}
              value={titulo} onChangeText={setTitulo} maxLength={100} />
            <TextInput style={[s.input, { minHeight: 90, textAlignVertical: 'top' }]} placeholder="Descripción (opcional)"
              placeholderTextColor={colors.textMuted} value={desc} onChangeText={setDesc} maxLength={1000} multiline />
            <View style={s.row}>
              <TouchableOpacity style={[s.btn, { backgroundColor: colors.background }]} onPress={() => setModal(false)}>
                <Text style={{ color: colors.textMuted, fontWeight: 'bold' }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.btn, enviando && { opacity: 0.5 }]} disabled={enviando} onPress={publicar}>
                <Text style={{ color: colors.text, fontWeight: 'bold' }}>{enviando ? 'Publicando…' : 'Publicar'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12 },
  back: { color: colors.primary, fontWeight: 'bold', width: 70 },
  title: { color: colors.text, fontSize: 22, fontWeight: 'bold' },
  card: { backgroundColor: colors.surface, borderRadius: 12, padding: 16 },
  name: { color: colors.text, fontSize: 17, fontWeight: 'bold' },
  desc: { color: colors.text, fontSize: 14, marginTop: 6 },
  meta: { color: colors.textMuted, fontSize: 12, marginTop: 8 },
  empty: { color: colors.textMuted, textAlign: 'center', marginTop: 48 },
  error: { color: colors.danger, textAlign: 'center', margin: 24 },
  fab: { position: 'absolute', left: 24, right: 24, backgroundColor: colors.primary, borderRadius: 12, padding: 16, alignItems: 'center' },
  fabText: { color: colors.text, fontSize: 16, fontWeight: 'bold' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 24 },
  modalCard: { backgroundColor: colors.surface, borderRadius: 12, padding: 20, gap: 12 },
  modalTitle: { color: colors.text, fontSize: 18, fontWeight: 'bold' },
  input: { backgroundColor: colors.background, color: colors.text, borderRadius: 8, padding: 12, fontSize: 15 },
  row: { flexDirection: 'row', gap: 12 },
  btn: { flex: 1, backgroundColor: colors.primary, borderRadius: 8, padding: 14, alignItems: 'center' },
})