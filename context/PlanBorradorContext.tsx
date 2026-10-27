import { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react'
import { ParadaBorrador } from '../types/planes'

const MAX_PARADAS = 10

type Ctx = {
  paradas: ParadaBorrador[]
  agregar: (p: ParadaBorrador) => boolean   // false si ya llegó al máximo
  quitar: (idLugar: number) => void
  mover: (index: number, delta: -1 | 1) => void
  reemplazar: (paradas: ParadaBorrador[]) => void
  limpiar: () => void
  estaEnPlan: (idLugar: number) => boolean
}

const PlanBorradorContext = createContext<Ctx | null>(null)

export function PlanBorradorProvider({ children }: { children: ReactNode }) {
  const [paradas, setParadas] = useState<ParadaBorrador[]>([])

  const agregar = useCallback((p: ParadaBorrador) => {
    if (paradas.some(x => x.id_lugar === p.id_lugar)) return true
    if (paradas.length >= MAX_PARADAS) return false
    setParadas(prev => [...prev, p])
    return true
  }, [paradas])

  const quitar = useCallback((id: number) => setParadas(prev => prev.filter(p => p.id_lugar !== id)), [])

  const mover = useCallback((index: number, delta: -1 | 1) => {
    setParadas(prev => {
      const j = index + delta
      if (j < 0 || j >= prev.length) return prev
      const copia = [...prev]
      ;[copia[index], copia[j]] = [copia[j], copia[index]]
      return copia
    })
  }, [])

  const reemplazar = useCallback((nuevas: ParadaBorrador[]) => setParadas(nuevas), [])
  const limpiar = useCallback(() => setParadas([]), [])
  const estaEnPlan = useCallback((id: number) => paradas.some(p => p.id_lugar === id), [paradas])

  const value = useMemo(
    () => ({ paradas, agregar, quitar, mover, reemplazar, limpiar, estaEnPlan }),
    [paradas, agregar, quitar, mover, reemplazar, limpiar, estaEnPlan]
  )
  return <PlanBorradorContext.Provider value={value}>{children}</PlanBorradorContext.Provider>
}

export function usePlanBorrador(): Ctx {
  const ctx = useContext(PlanBorradorContext)
  if (!ctx) throw new Error('usePlanBorrador debe usarse dentro de PlanBorradorProvider')
  return ctx
}