import { Modal, View, Text, TouchableOpacity, StyleSheet, Pressable } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors } from '../theme/colors'

export type ItemMenu = { label: string; onPress: () => void; destructive?: boolean }

type Props = { visible: boolean; onClose: () => void; items: ItemMenu[] }

export default function MenuFlotante({ visible, onClose, items }: Props) {
  const insets = useSafeAreaInsets()

  const elegir = (item: ItemMenu) => {
    onClose()
    setTimeout(item.onPress, 250) // espera a que cierre el modal antes de navegar
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={s.root}>
        <View style={[s.panel, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }]}>
          <Text style={s.brand}>QuePlan</Text>
          {items.map(item => (
            <TouchableOpacity key={item.label} style={s.item} onPress={() => elegir(item)}>
              <Text style={[s.itemText, item.destructive && { color: colors.danger }]}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Pressable style={s.backdrop} onPress={onClose} />
      </View>
    </Modal>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, flexDirection: 'row' },
  panel: { width: 280, backgroundColor: colors.background, paddingHorizontal: 20 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  brand: { color: colors.primary, fontSize: 28, fontWeight: 'bold', marginBottom: 24 },
  item: { paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  itemText: { color: colors.text, fontSize: 16 },
})