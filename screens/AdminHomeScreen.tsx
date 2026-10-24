import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native'
import { supabase } from '../lib/supabase'

type Negocio = {
    id_negocio: number
    nombre: string
    direccion: string
    telefono: string
    estado: string
}

export default function AdminHomeScreen() {
    const [negocios, setNegocios] = useState<Negocio[]>([])

    const handleLogout = async () => {
        const { error } = await supabase.auth.signOut()
        if (error) {
            Alert.alert('Error', error.message)
        }
    }

    const obtenerNegocios = async () => {
        const { data, error } = await supabase
            .from('negocios')
            .select('*')
            .eq('estado', 'pendiente')

        if (!error && data) {
            setNegocios(data)
        }
    }

    const actualizarEstado = async (id_negocio: number, nuevoEstado: string) => {
        const { error } = await supabase
            .from('negocios')
            .update({ estado: nuevoEstado })
            .eq('id_negocio', id_negocio)

        if (error) {
            Alert.alert('Error', error.message)
        } else {
            Alert.alert('Éxito', `Negocio ${nuevoEstado} correctamente`)
            obtenerNegocios()
        }
    }

    const confirmarAccion = (id_negocio: number, accion: string) => {
        Alert.alert(
            `${accion === 'aprobado' ? 'Aprobar' : 'Rechazar'} negocio`,
            `¿Estás seguro de que quieres ${accion === 'aprobado' ? 'aprobar' : 'rechazar'} este negocio?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Confirmar', onPress: () => actualizarEstado(id_negocio, accion) }
            ]
        )
    }

    useEffect(() => {
        obtenerNegocios()
    }, [])

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Panel de administrador</Text>
            <Text style={styles.subtitle}>Negocios pendientes</Text>

            {negocios.length === 0 ? (
                <Text style={styles.empty}>No hay negocios pendientes</Text>
            ) : (
                <FlatList
                    data={negocios}
                    keyExtractor={(item) => item.id_negocio.toString()}
                    renderItem={({ item }) => (
                        <View style={styles.card}>
                            <Text style={styles.nombre}>{item.nombre}</Text>
                            <Text style={styles.info}>{item.direccion}</Text>
                            <Text style={styles.info}>{item.telefono}</Text>

                            <View style={styles.botones}>
                                <TouchableOpacity
                                    style={styles.aprobar}
                                    onPress={() => confirmarAccion(item.id_negocio, 'aprobado')}
                                >
                                    <Text style={styles.botonTexto}>Aprobar</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.rechazar}
                                    onPress={() => confirmarAccion(item.id_negocio, 'rechazado')}
                                >
                                    <Text style={styles.botonTexto}>Rechazar</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                />
            )}

            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Text style={styles.logoutText}>Cerrar sesión</Text>
            </TouchableOpacity>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121212',
        paddingHorizontal: 24,
        paddingTop: 60,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#A0A0A0',
        marginBottom: 24,
    },
    empty: {
        color: '#A0A0A0',
        textAlign: 'center',
        marginTop: 40,
        fontSize: 16,
    },
    card: {
        backgroundColor: '#1E1E1E',
        borderRadius: 8,
        padding: 16,
        marginBottom: 16,
    },
    nombre: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    info: {
        fontSize: 14,
        color: '#A0A0A0',
        marginBottom: 2,
    },
    botones: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 12,
    },
    aprobar: {
        flex: 1,
        backgroundColor: '#2ECC71',
        borderRadius: 8,
        padding: 10,
        alignItems: 'center',
    },
    rechazar: {
        flex: 1,
        backgroundColor: '#E74C3C',
        borderRadius: 8,
        padding: 10,
        alignItems: 'center',
    },
    botonTexto: {
        color: '#FFFFFF',
        fontWeight: 'bold',
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