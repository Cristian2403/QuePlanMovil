import { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native'
import { supabase } from '../../lib/supabase'
import { colors } from '../../theme/colors'
import BusinessReviewTab from './BusinessReviewTab'
import ActiveBusinessesTab from './ActiveBusinessesTab'
import UsersTab from './UsersTab' 

const TABS = [
  { key: 'verificacion', label: 'Verificación' },
  { key: 'negocios', label: 'Negocios' },
  { key: 'usuarios', label: 'Usuarios' },
] as const

type TabKey = typeof TABS[number]['key']

export default function AdminHomeScreen() {
  const [tab, setTab] = useState<TabKey>('verificacion')

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Panel de administración</Text>
        <TouchableOpacity onPress={() => supabase.auth.signOut()}>
          <Text style={s.logout}>Salir</Text>
        </TouchableOpacity>
      </View>

      <View style={s.tabs}>
        {TABS.map(t => (
          <TouchableOpacity key={t.key} style={[s.tab, tab === t.key && s.tabActive]} onPress={() => setTab(t.key)}>
            <Text style={[s.tabText, tab === t.key && s.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ flex: 1 }}>
        {tab === 'verificacion' && <BusinessReviewTab />}
        {tab === 'negocios' && <ActiveBusinessesTab />}
        {tab === 'usuarios' && <UsersTab />}
      </View>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16 },
  title: { color: colors.text, fontSize: 22, fontWeight: 'bold' },
  logout: { color: colors.primary, fontWeight: 'bold' },
  tabs: { flexDirection: 'row', margin: 16, backgroundColor: colors.surface, borderRadius: 10, padding: 4 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  tabActive: { backgroundColor: colors.primary },
  tabText: { color: colors.textMuted, fontWeight: 'bold', fontSize: 13 },
  tabTextActive: { color: colors.text },
})