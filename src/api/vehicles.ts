import client from './client';
import type { Vehicle } from '@/types/api';

export async function listVehicles(): Promise<Vehicle[]> {
    const { data } = await client.get('/vehicles');
    return data;
}

export async function getVehicle(vehicleId: string): Promise<Vehicle> {
    const { data } = await client.get(`/vehicles/${vehicleId}`);
    return data;
}

export async function createVehicle(payload: Vehicle): Promise<Vehicle> {
    const { data } = await client.post('/vehicles', payload);
    return data;
}

export async function updateVehicle(vehicleId: string, payload: Partial<Omit<Vehicle, 'vehicle_id'>>): Promise<Vehicle> {
    const { data } = await client.put(`/vehicles/${vehicleId}`, payload);
    return data;
}

export async function deleteVehicle(vehicleId: string): Promise<void> {
    await client.delete(`/vehicles/${vehicleId}`);
}
