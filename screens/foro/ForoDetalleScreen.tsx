import { useCallback, useEffect, useRef, useState } from 'react'
import {
  View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator,
  KeyboardAvoidingView,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { RootStackParamList } from '../../navigation/AppNavigator'
import { supabase } from '../../lib/supabase'
import { colors } from '../../theme/colors'
import { Comentario, Foro } from '../../types/social'
import {
  obtenerForo, listarComentarios, comentarForo, eliminarComentario, eliminarForo,
} from '../../lib/foroApi'
import { hace } from '../../lib/tiempo'

type Props = NativeStackScreenProps<RootStackParamList, 'ForoDetalle'>

export default function ForoDetalleScreen({ navigation, route }: Props) {
  const { idForo } = route.params
  const insets = useSafeAreaInsets()
  const listRef = useRef<FlatList<Comentario>>(null)

  const [foro, setForo] = useState<Foro | null>(null)
  const [comentarios, setComentarios] = useState<Comentario[]>([])
  const [miId, setMiId] = useState<string | null>(null)
  const [soyAdmin, setSoyAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)

  const cargar = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [f, c, ses] = await Promise.all([
        obtenerForo(idForo), listarComentarios(idForo), supabase.auth.getSession(),
      ])
      setForo(f)
      setComentarios(c)
      const uid = ses.data.session?.user.id ?? null
      setMiId(uid)
      if (uid) {
        const { data } = await supabase.from('usuarios').select('rol').eq('id_usuario', uid).single()
        setSoyAdmin(data?.rol === 'administrador')
      }
    } catch (e: any) {
      setError(e.message ?? 'No se pudo cargar el foro')
    }
    setLoading(false)
  }, [idForo])

  useEffect(() => { cargar() }, [cargar])

  const enviar = async () => {
    const t = texto.trim()
    if (!t) return
    setEnviando(true)
    try {
      await comentarForo(idForo, t)
      setTexto('')
      setComentarios(await listarComentarios(idForo))
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 150)
    } catch (e: any) {
      Alert.alert('No se pudo comentar', e.message ?? 'Intenta de nuevo.')
    } finally {
      setEnviando(false)
    }
  }

  const borrarComentario = (c: Comentario) =>
    Alert.alert('Eliminar comentario', '¿Seguro que quieres eliminarlo?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive',
        onPress: async () => {
          try {
            await eliminarComentario(c.id_comentario)
            setComentarios(prev => prev.filter(x => x.id_comentario !== c.id_comentario))
          } catch (e: any) {
            Alert.alert('No se pudo eliminar', e.message ?? '')
          }
        },
      },
    ])

  const borrarForo = () =>
    Alert.alert('Eliminar foro', 'Se eliminará el foro con todos sus comentarios. No se puede deshacer.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive',
        onPress: async () => {
          try {
            await eliminarForo(idForo)
            navigation.goBack()
          } catch (e: any) {
            Alert.alert('No se pudo eliminar', e.message ?? '')
          }
        },
      },
    ])

  const header = (
    <View style={s.header}>
      <TouchableOpacity onPress={() => navigation.goBack()}><Text style={s.back}>‹ Volver</Text></TouchableOpacity>
      <Text style={s.title}>Foro</Text>
      <View style={{ width: 70 }} />
    </View>
  )

  if (loading && !foro) {
    return (
      <View style={[s.container, { paddingTop: insets.top }]}>
        {header}
        <ActivityIndicator color={colors.primary} style={{ marginTop: 48 }} />
      </View>
    )
  }

  if (error || !foro) {
    return (
      <View style={[s.container, { paddingTop: insets.top }]}>
        {header}
        <Text style={s.error}>{error ?? 'Foro no encontrado'}</Text>
        <TouchableOpacity style={s.retry} onPress={cargar}><Text style={s.retryText}>Reintentar</Text></TouchableOpacity>
      </View>
    )
  }

  const puedeBorrarForo = foro.id_autor === miId || soyAdmin

  return (
    <KeyboardAvoidingView style={[s.container, { paddingTop: insets.top }]} behavior="padding">
      {header}
      <FlatList
        ref={listRef}
        data={comentarios}
        keyExtractor={c => String(c.id_comentario)}
        contentContainerStyle={{ padding: 16, gap: 10 }}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View style={s.foroCard}>
            <Text style={s.foroTitle}>{foro.titulo}</Text>
            {!!foro.descripcion && <Text style={s.foroDesc}>{foro.descripcion}</Text>}
            <Text style={s.meta}>por {foro.autor}  ·  {hace(foro.fecha)}</Text>
            {puedeBorrarForo && (
              <TouchableOpacity onPress={borrarForo}><Text style={s.delete}>Eliminar foro</Text></TouchableOpacity>
            )}
            <Text style={s.count}>{comentarios.length} {comentarios.length === 1 ? 'comentario' : 'comentarios'}</Text>
          </View>
        }
        ListEmptyComponent={<Text style={s.empty}>Sé el primero en comentar.</Text>}
        renderItem={({ item }) => (
          <View style={s.comment}>
            <View style={s.commentTop}>
              <Text style={s.author}>{item.autor}</Text>
              <Text style={s.meta}>{hace(item.fecha)}</Text>
            </View>
            <Text style={s.text}>{item.contenido}</Text>
            {(item.id_autor === miId || soyAdmin) && (
              <TouchableOpacity onPress={() => borrarComentario(item)}><Text style={s.delete}>Eliminar</Text></TouchableOpacity>
            )}
          </View>
        )}
      />

      <View style={[s.inputBar, { paddingBottom: 8 + insets.bottom }]}>
        <TextInput
          style={s.input}
          placeholder="Escribe un comentario"
          placeholderTextColor={colors.textMuted}
          value={texto}
          onChangeText={setTexto}
          maxLength={1000}
          multiline
        />
        <TouchableOpacity style={[s.send, (enviando || !texto.trim()) && { opacity: 0.5 }]} disabled={enviando || !texto.trim()} onPress={enviar}>
          <Text style={s.sendText}>{enviando ? '…' : 'Enviar'}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12 },
  back: { color: colors.primary, fontWeight: 'bold', width: 70 },
  title: { color: colors.text, fontSize: 22, fontWeight: 'bold' },
  foroCard: { backgroundColor: colors.surface, borderRadius: 12, padding: 16, marginBottom: 8 },
  foroTitle: { color: colors.text, fontSize: 20, fontWeight: 'bold' },
  foroDesc: { color: colors.text, fontSize: 14, marginTop: 8 },
  count: { color: colors.textMuted, fontSize: 12, fontWeight: 'bold', marginTop: 12 },
  comment: { backgroundColor: colors.surface, borderRadius: 10, padding: 12 },
  commentTop: { flexDirection: 'row', justifyContent: 'space-between' },
  author: { color: colors.primary, fontWeight: 'bold', fontSize: 13 },
  text: { color: colors.text, fontSize: 14, marginTop: 6 },
  meta: { color: colors.textMuted, fontSize: 12, marginTop: 6 },
  delete: { color: colors.danger, fontSize: 12, fontWeight: 'bold', marginTop: 8 },
  empty: { color: colors.textMuted, textAlign: 'center', marginTop: 24 },
  error: { color: colors.danger, textAlign: 'center', margin: 24 },
  retry: { alignSelf: 'center', backgroundColor: colors.primary, borderRadius: 8, paddingVertical: 12, paddingHorizontal: 24 },
  retryText: { color: colors.text, fontWeight: 'bold' },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, padding: 8, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, backgroundColor: colors.background },
  input: { flex: 1, backgroundColor: colors.surface, color: colors.text, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, maxHeight: 110 },
  send: { backgroundColor: colors.primary, borderRadius: 10, paddingVertical: 12, paddingHorizontal: 16 },
  sendText: { color: colors.text, fontWeight: 'bold' },
})