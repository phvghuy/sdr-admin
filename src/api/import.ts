import client from './client';
import type { ImportResponse } from '../types/api';

export async function importCSV(ordersFile: File, vehiclesFile: File, warehousesFile: File) {
    const form = new FormData();
    form.append('orders_file', ordersFile);
    form.append('vehicles_file', vehiclesFile);
    form.append('warehouses_file', warehousesFile);
    const { data } = await client.post('/import/upload', form);
    return data as ImportResponse;
}