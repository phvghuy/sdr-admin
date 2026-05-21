import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { OptimizeResponse } from '@/types/api'

export type OptimizeRun = {
    jobId: string
    result: OptimizeResponse
    runAt: string  // ISO string — Date is not serializable in JSON
}

export type JobFailure = {
    jobId: string
    status: 'failure' | 'expired'
    error: string | null
}

interface OptimizeStore {
    runs: OptimizeRun[]
    activeJobId: string | null
    lastFailure: JobFailure | null
    addRun: (jobId: string, result: OptimizeResponse) => void
    setActiveJobId: (id: string | null) => void
    setLastFailure: (failure: JobFailure | null) => void
}

export const useOptimizeStore = create<OptimizeStore>()(
    persist(
        (set) => ({
            runs: [],
            activeJobId: null,
            lastFailure: null,
            addRun: (jobId, result) =>
                set((state) => ({
                    runs: [{ jobId, result, runAt: new Date().toISOString() }, ...state.runs],
                    activeJobId: null,
                    lastFailure: null,
                })),
            setActiveJobId: (id) => set({ activeJobId: id }),
            setLastFailure: (failure) => set({ lastFailure: failure }),
        }),
        {
            name: 'optimize-store',
            partialize: (state) => ({ runs: state.runs }),
        },
    ),
)
