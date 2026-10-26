import { supabase } from './supabase'
import { LugarMapa } from '../types/planes'

export type FiltrosMapa = {
  lat: number
  lng: number
  radioKm: number | null
  precioMax: number | null
  categoria?: string | null
}

// Supabase puede devolver numeric como texto: se convierte a número
const mapear = (r: any): LugarMapa => ({
  id_lugar: r.id_lugar,
  nombre: r.nombre,
  descripcion: r.descripcion,
  latitud: Number(r.latitud),
  longitud: Number(r.longitud),
  categoria: r.categoria,
  imagen: r.imagen,
  id_negocio: r.id_negocio,
  precio_promedio: r.precio_promedio === null ? null : Number(r.precio_promedio),
  negocio_nombre: r.negocio_nombre,
  distancia_km: r.distancia_km === null ? null : Number(r.distancia_km),
})

export async function listarLugaresDisponibles(f: FiltrosMapa): Promise<LugarMapa[]> {
  const { data, error } = await supabase.rpc('lugares_disponibles', {
    p_lat: f.lat,
    p_lng: f.lng,
    p_radio_km: f.radioKm,
    p_precio_max: f.precioMax,
    p_categoria: f.categoria ?? null,
  })
  if (error) throw new Error(error.message)
  return (data ?? []).map(mapear)
}

// Todos los lugares visibles, sin filtros ni distancia (selector de lugares y validación de planes)
export async function listarTodosLosLugares(): Promise<LugarMapa[]> {
  const { data, error } = await supabase.rpc('lugares_disponibles', {
    p_lat: null, p_lng: null, p_radio_km: null, p_precio_max: null, p_categoria: null,
  })
  if (error) throw new Error(error.message)
  return (data ?? []).map(mapear)
}