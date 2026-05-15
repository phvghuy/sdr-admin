import { create } from 'zustand'
import type { OptimizeResponse } from '@/types/api'

export type OptimizeRun = {
    jobId: string
    result: OptimizeResponse
    runAt: Date
}

interface OptimizeStore {
    runs: OptimizeRun[]
    activeJobId: string | null
    addRun: (jobId: string, result: OptimizeResponse) => void
    setActiveJobId: (id: string | null) => void
}

export const useOptimizeStore = create<OptimizeStore>((set) => ({
    runs: [],
    activeJobId: null,
    addRun: (jobId, result) =>
        set((state) => ({
            runs: [{ jobId, result, runAt: new Date() }, ...state.runs],
            activeJobId: null,
        })),
    setActiveJobId: (id) => set({ activeJobId: id }),
}))
