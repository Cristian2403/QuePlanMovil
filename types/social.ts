import { ModoTransporte } from './planes'

export type Notificacion = {
  id_notificacion: number
  mensaje: string
  leida: boolean
  fecha: string
}

export type PlanPublico = {
  id_plan: number
  nombre: string
  fecha: string | null
  hora_inicio: string | null
  presupuesto: number | null
  modo_transporte: ModoTransporte
  autor: string
  num_paradas: number
  costo_estimado: number
}

export type Foro = {
  id_foro: number
  titulo: string
  descripcion: string | null
  autor: string
  id_autor: string
  fecha: string
  num_comentarios: number
  ultima_actividad: string
}

export type Comentario = {
  id_comentario: number
  contenido: string
  autor: string
  id_autor: string
  fecha: string
}