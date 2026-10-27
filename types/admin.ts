export type EstadoNegocio = 'pendiente' | 'aprobado' | 'rechazado' | 'dado_de_baja'

export type Negocio = {
  id_negocio: number
  id_usuario: string
  nombre: string
  descripcion: string | null
  direccion: string | null
  telefono: string | null
  imagen: string | null
  documentos: string[]
  estado: EstadoNegocio
  motivo_estado: string | null
  creado_en: string
}

export type UsuarioAdmin = {
  id_usuario: string
  nombre: string | null
  email: string | null
  rol: string
  bloqueado: boolean
  motivo_bloqueo: string | null
  bloqueado_hasta: string | null
}