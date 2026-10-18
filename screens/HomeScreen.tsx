import { View, StyleSheet, TouchableOpacity, Text, Alert } from 'react-native'
import MapView from 'react-native-maps'
import { supabase } from '../lib/supabase'

export default function HomeScreen() {

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      Alert.alert('Error', error.message)
    }
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: 6.2442,
          longitude: -75.5812,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      />

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Cerrar sesión</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  logoutButton: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    backgroundColor: '#E74C3C',
    borderRadius: 8,
    padding: 12,
  },
  logoutText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
})