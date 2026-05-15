import client from './client';
import type { Warehouse } from '@/types/api';

export async function listWarehouses(): Promise<Warehouse[]> {
    const { data } = await client.get('/warehouses');
    return data;
}

export async function getWarehouse(warehouseId: string): Promise<Warehouse> {
    const { data } = await client.get(`/warehouses/${warehouseId}`);
    return data;
}

export async function createWarehouse(payload: Warehouse): Promise<Warehouse> {
    const { data } = await client.post('/warehouses', payload);
    return data;
}

export async function updateWarehouse(warehouseId: string, payload: Partial<Omit<Warehouse, 'warehouse_id'>>): Promise<Warehouse> {
    const { data } = await client.put(`/warehouses/${warehouseId}`, payload);
    return data;
}

export async function deleteWarehouse(warehouseId: string): Promise<void> {
    await client.delete(`/warehouses/${warehouseId}`);
}
