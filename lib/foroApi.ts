import { supabase } from './supabase'
import { Comentario, Foro } from '../types/social'

const mapForo = (r: any): Foro => ({ ...r, num_comentarios: Number(r.num_comentarios) })

export async function listarForos(): Promise<Foro[]> {
  const { data, error } = await supabase.rpc('listar_foros')
  if (error) throw new Error(error.message)
  return (data ?? []).map(mapForo)
}

export async function obtenerForo(idForo: number): Promise<Foro> {
  const { data, error } = await supabase.rpc('obtener_foro', { p_id: idForo })
  if (error) throw new Error(error.message)
  if (!data || data.length === 0) throw new Error('Este foro ya no existe')
  return mapForo(data[0])
}

export async function crearForo(titulo: string, descripcion: string | null): Promise<number> {
  const { data, error } = await supabase.rpc('crear_foro', { p_titulo: titulo, p_descripcion: descripcion })
  if (error) throw new Error(error.message)
  return data as number
}

export async function listarComentarios(idForo: number): Promise<Comentario[]> {
  const { data, error } = await supabase.rpc('listar_comentarios', { p_id_foro: idForo })
  if (error) throw new Error(error.message)
  return (data ?? []) as Comentario[]
}

export async function comentarForo(idForo: number, contenido: string): Promise<void> {
  const { error } = await supabase.rpc('comentar_foro', { p_id_foro: idForo, p_contenido: contenido })
  if (error) throw new Error(error.message)
}

export async function eliminarComentario(idComentario: number): Promise<void> {
  const { error } = await supabase.rpc('eliminar_comentario', { p_id: idComentario })
  if (error) throw new Error(error.message)
}

export async function eliminarForo(idForo: number): Promise<void> {
  const { error } = await supabase.rpc('eliminar_foro', { p_id: idForo })
  if (error) throw new Error(error.message)
}