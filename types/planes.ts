export type EstadoPlan = 'borrador' | 'activo' | 'completado' | 'cancelado'

export type ModoTransporte = 'a_pie' | 'moto' | 'carro' | 'transporte_publico'

export type Lugar = {
  id_lugar: number
  nombre: string
  descripcion: string | null
  latitud: number
  longitud: number
  categoria: string | null
  imagen: string | null
  id_negocio: number | null
  precio_promedio: number | null
}

export type LugarResumen = Pick<Lugar, 'id_lugar' | 'nombre' | 'categoria' | 'precio_promedio'>

export type Plan = {
  id_plan: number
  nombre: string
  fecha: string | null          // 'YYYY-MM-DD'
  hora_inicio: string | null    // 'HH:MM:SS'
  presupuesto: number | null
  estado: string | null
  modo_transporte: ModoTransporte
  publico: boolean
  creado_en: string
  id_usuario: string
}

export type PlanConParadas = Plan & {
  plan_lugares: { orden: number | null; lugares: LugarResumen | null }[]
}

// Lo que se envía al guardar (crear o editar)
export type PlanInput = {
  id_plan?: number | null
  nombre: string
  fecha: string | null
  hora_inicio: string | null
  presupuesto: number | null
  modo_transporte: ModoTransporte
  publico: boolean
  estado: 'borrador' | 'activo'
  lugares: number[]             // ids de lugares, en orden de visita
}

// Lugar tal como lo devuelve lugares_disponibles (mapa y selector)
export type LugarMapa = Lugar & {
  negocio_nombre: string | null
  distancia_km: number | null
}

// Parada en el borrador de un plan (contexto compartido)
export type ParadaBorrador = Pick<
  Lugar, 'id_lugar' | 'nombre' | 'categoria' | 'precio_promedio' | 'latitud' | 'longitud'
>

// Parada en el detalle de un plan
export type ParadaDetalle = Pick<
  Lugar, 'id_lugar' | 'nombre' | 'descripcion' | 'categoria' | 'precio_promedio' | 'latitud' | 'longitud'
>

export type PlanDetalle = Plan & {
  plan_lugares: { orden: number | null; lugares: ParadaDetalle | null }[]
}