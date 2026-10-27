import { supabase } from './supabase'
import { ModoTransporte, PlanConParadas, PlanDetalle, PlanInput } from '../types/planes'


// ---------- Consultas ----------

async function uidActual(): Promise<string> {
  const { data } = await supabase.auth.getSession()
  const uid = data.session?.user.id
  if (!uid) throw new Error('No se encontró la sesión. Inicia sesión de nuevo.')
  return uid
}

export async function listarMisPlanes(): Promise<PlanConParadas[]> {
  const uid = await uidActual()
  const { data, error } = await supabase
    .from('planes')
    .select('*, plan_lugares(orden, lugares(id_lugar, nombre, categoria, precio_promedio))')
    .eq('id_usuario', uid)
    .order('fecha', { ascending: true, nullsFirst: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as PlanConParadas[]
}

export async function obtenerPlan(idPlan: number): Promise<PlanDetalle> {
  const { data, error } = await supabase
    .from('planes')
    .select('*, plan_lugares(orden, lugares(id_lugar, nombre, descripcion, categoria, precio_promedio, latitud, longitud))')
    .eq('id_plan', idPlan)
    .single()
  if (error) throw new Error(error.message)

  const plan = data as unknown as PlanDetalle
  plan.plan_lugares = [...(plan.plan_lugares ?? [])]
    .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))
    .map(pl => ({
      ...pl,
      lugares: pl.lugares
        ? {
            ...pl.lugares,
            latitud: Number(pl.lugares.latitud),
            longitud: Number(pl.lugares.longitud),
            precio_promedio: pl.lugares.precio_promedio === null ? null : Number(pl.lugares.precio_promedio),
          }
        : null,
    }))
  return plan
}

// Crea (id_plan null) o edita un plan con todas sus paradas, de forma atómica
export async function guardarPlan(input: PlanInput): Promise<number> {
  const { data, error } = await supabase.rpc('guardar_plan', {
    p_id_plan: input.id_plan ?? null,
    p_nombre: input.nombre,
    p_fecha: input.fecha,
    p_hora: input.hora_inicio,
    p_presupuesto: input.presupuesto,
    p_modo: input.modo_transporte,
    p_publico: input.publico,
    p_estado: input.estado,
    p_lugares: input.lugares,
  })
  if (error) throw new Error(error.message)
  return data as number
}

export async function eliminarPlan(idPlan: number): Promise<void> {
  const { error } = await supabase.rpc('eliminar_plan', { p_id: idPlan })
  if (error) throw new Error(error.message)
}

// ---------- Formateadores ----------

const DIAS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb']
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

// Fecha local como 'YYYY-MM-DD' (no usar toISOString: devuelve UTC y puede cambiar el día)
export function aISO(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

export const hoyISO = () => aISO(new Date())

export function formatearFecha(iso: string | null): string {
  if (!iso) return 'Sin fecha'
  if (iso === hoyISO()) return 'Hoy'
  if (iso === aISO(new Date(Date.now() + 86400000))) return 'Mañana'
  const [y, m, d] = iso.split('-').map(Number)
  const f = new Date(y, m - 1, d)
  return `${DIAS[f.getDay()]} ${d} ${MESES[m - 1]}`
}

export const formatearHora = (hora: string | null) => (hora ? hora.slice(0, 5) : '')

export function formatearCOP(n: number | null): string {
  if (n === null || n === undefined) return 'Sin presupuesto'
  return '$' + String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

export const ETIQUETA_TRANSPORTE: Record<ModoTransporte, string> = {
  a_pie: 'A pie',
  moto: 'Moto',
  carro: 'Carro',
  transporte_publico: 'Transporte público',
}