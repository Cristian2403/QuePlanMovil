import { supabase } from './supabase'
import { Notificacion } from '../types/social'

export async function listarNotificaciones(): Promise<Notificacion[]> {
  const { data, error } = await supabase.rpc('listar_notificaciones')
  if (error) throw new Error(error.message)
  return (data ?? []) as Notificacion[]
}

export async function contarNoLeidas(): Promise<number> {
  const { data, error } = await supabase.rpc('contar_notificaciones_no_leidas')
  if (error) throw new Error(error.message)
  return Number(data ?? 0)
}

// ids = null marca todas
export async function marcarLeidas(ids: number[] | null): Promise<void> {
  const { error } = await supabase.rpc('marcar_notificaciones_leidas', { p_ids: ids })
  if (error) throw new Error(error.message)
}