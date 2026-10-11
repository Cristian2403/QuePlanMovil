import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { supabase } from '../lib/supabase'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RootStackParamList } from '../navigation/AppNavigator'


type Props = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'Register'>
}


export default function RegisterScreen({ navigation }: Props) {
    const [nombre, setNombre] = useState<string>('')
    const [email, setEmail] = useState<string>('')
    const [contrasena, setContrasena] = useState<string>('')

    const handleRegister = async () => {
        if (!nombre || !email || !contrasena) {
            Alert.alert('Error', 'Por favor completa todos los campos')
            return
        }

        const { error } = await supabase.auth.signUp({
            email,
            password: contrasena,
            options: {
                data: {
                    nombre,
                    rol: 'usuario'
                }
            }
        })

        if (error) {
            Alert.alert('Error', error.message)
        } else {
            Alert.alert('Éxito', 'Cuenta creada correctamente')
        }
    }

    return (
        <View style={styles.container}>
            <View style={styles.logoContainer}>
                <Text style={[styles.logo, { fontFamily: 'Lobster_400Regular' }]}>¿Que</Text>
                <Text style={[styles.logo, { fontFamily: 'Lobster_400Regular' }]}>Plan?</Text>
            </View>


            <Text style={styles.title}>Crear cuenta</Text>

            <TextInput
                style={styles.input}
                placeholder="Nombre"
                placeholderTextColor="#A0A0A0"
                value={nombre}
                onChangeText={setNombre}
            />

            <TextInput
                style={styles.input}
                placeholder="Correo electrónico"
                placeholderTextColor="#A0A0A0"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
            />

            <TextInput
                style={styles.input}
                placeholder="Contraseña"
                placeholderTextColor="#A0A0A0"
                value={contrasena}
                onChangeText={setContrasena}
                secureTextEntry
            />

            <TouchableOpacity style={styles.button} onPress={handleRegister}>
                <Text style={styles.buttonText}>Registrarse</Text>
            </TouchableOpacity>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121212',
        justifyContent: 'center',
        paddingHorizontal: 24,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 32,
        textAlign: 'center',
    },
    input: {
        backgroundColor: '#1E1E1E',
        color: '#FFFFFF',
        borderRadius: 8,
        padding: 14,
        marginBottom: 16,
        fontSize: 16,
    },
    button: {
        backgroundColor: '#4A90E2',
        borderRadius: 8,
        padding: 16,
        alignItems: 'center',
        marginTop: 8,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 40,
    },
    logo: {
        fontSize: 48,
        color: '#4A90E2',
        lineHeight: 52,
    },
})