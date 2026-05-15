import client from './client';
import type { OptimizeResponse } from '../types/api';

export async function runOptimize(): Promise<OptimizeResponse> {
    const { data } = await client.post('/optimize');
    return data;
}

export async function runOptimizeAsync(): Promise<string> {
    const { data } = await client.post('/optimize/async');
    return data.job_id;
}