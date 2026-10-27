import { supabase } from './supabase'
import { PlanPublico } from '../types/social'

export async function explorarPlanes(f: { presupuestoMax: number | null; busqueda: string }): Promise<PlanPublico[]> {
  const { data, error } = await supabase.rpc('explorar_planes', {
    p_presupuesto_max: f.presupuestoMax,
    p_busqueda: f.busqueda.trim() || null,
  })
  if (error) throw new Error(error.message)
  return (data ?? []).map((r: any): PlanPublico => ({
    id_plan: r.id_plan,
    nombre: r.nombre,
    fecha: r.fecha,
    hora_inicio: r.hora_inicio,
    presupuesto: r.presupuesto === null ? null : Number(r.presupuesto),
    modo_transporte: r.modo_transporte,
    autor: r.autor,
    num_paradas: Number(r.num_paradas),
    costo_estimado: Number(r.costo_estimado),
  }))
}

// Copia un plan público a tus planes como borrador y devuelve el id de la copia
export async function copiarPlan(idPlan: number): Promise<number> {
  const { data, error } = await supabase.rpc('copiar_plan', { p_id_plan: idPlan, p_fecha: null })
  if (error) throw new Error(error.message)
  return data as number
}