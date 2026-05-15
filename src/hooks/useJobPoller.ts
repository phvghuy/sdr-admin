import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getJob } from '@/api/jobs'
import { useOptimizeStore } from '@/store/optimizeStore'

export function useJobPoller() {
    const activeJobId = useOptimizeStore((s) => s.activeJobId)
    const addRun = useOptimizeStore((s) => s.addRun)
    const setActiveJobId = useOptimizeStore((s) => s.setActiveJobId)

    const { data: job } = useQuery({
        queryKey: ['job', activeJobId],
        queryFn: () => getJob(activeJobId!),
        enabled: !!activeJobId,
        refetchInterval: (query) =>
            query.state.data?.status === 'pending' ? 3000 : false,
    })

    useEffect(() => {
        if (!job) return
        if (job.status === 'success' && job.result) {
            addRun(job.job_id, job.result)
        } else if (job.status === 'failure' || job.status === 'expired') {
            setActiveJobId(null)
        }
    }, [job, addRun, setActiveJobId])
}
