import client from './client';
import type { JobResponse } from '../types/api';

export async function getJob(jobId: string): Promise<JobResponse> {
    const { data } = await client.get(`/jobs/${jobId}`);
    return data;
}