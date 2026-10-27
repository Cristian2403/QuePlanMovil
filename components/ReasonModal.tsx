import { useEffect, useState, ReactNode } from 'react'
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native'
import { colors } from '../theme/colors'

type Props = {
  visible: boolean
  title: string
  confirmLabel: string
  destructive?: boolean
  loading?: boolean
  children?: ReactNode
  onCancel: () => void
  onConfirm: (motivo: string) => void
}

export default function ReasonModal({
  visible, title, confirmLabel, destructive = true, loading, children, onCancel, onConfirm,
}: Props) {
  const [motivo, setMotivo] = useState('')
  useEffect(() => { if (visible) setMotivo('') }, [visible])

  const disabled = loading || motivo.trim().length < 5

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={s.backdrop}>
        <View style={s.card}>
          <Text style={s.title}>{title}</Text>
          {children}
          <TextInput
            style={s.input}
            placeholder="Motivo (mínimo 5 caracteres)"
            placeholderTextColor={colors.textMuted}
            value={motivo}
            onChangeText={setMotivo}
            multiline
          />
          <View style={s.row}>
            <TouchableOpacity style={[s.btn, s.btnGhost]} onPress={onCancel}>
              <Text style={s.btnGhostText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.btn, { backgroundColor: destructive ? colors.danger : colors.primary }, disabled && { opacity: 0.5 }]}
              disabled={disabled}
              onPress={() => onConfirm(motivo.trim())}
            >
              <Text style={s.btnText}>{loading ? 'Procesando…' : confirmLabel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const s = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 24 },
  card: { backgroundColor: colors.surface, borderRadius: 12, padding: 20 },
  title: { color: colors.text, fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  input: {
    backgroundColor: colors.background, color: colors.text, borderRadius: 8,
    padding: 12, minHeight: 90, textAlignVertical: 'top', fontSize: 15,
  },
  row: { flexDirection: 'row', gap: 12, marginTop: 16 },
  btn: { flex: 1, borderRadius: 8, padding: 14, alignItems: 'center' },
  btnGhost: { backgroundColor: colors.background },
  btnGhostText: { color: colors.textMuted, fontWeight: 'bold' },
  btnText: { color: colors.text, fontWeight: 'bold' },
})