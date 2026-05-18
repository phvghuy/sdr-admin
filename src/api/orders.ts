import client from './client';
import type { Order, PaginatedResponse } from '@/types/api';

type OrderFilters = {
    warehouse_id?: string
    status?: string
    search?: string
}

export async function listOrders(page = 1, size = 20, filters: OrderFilters = {}): Promise<PaginatedResponse<Order>> {
    const params = {
        page, size,
        ...(filters.warehouse_id && { warehouse_id: filters.warehouse_id }),
        ...(filters.status && { status: filters.status }),
        ...(filters.search && { search: filters.search }),
    }
    const { data } = await client.get('/orders', { params });
    return data;
}

export async function getOrder(orderId: string): Promise<Order> {
    const { data } = await client.get(`/orders/${orderId}`);
    return data;
}

export async function createOrder(payload: Omit<Order, 'status'>): Promise<Order> {
    const { data } = await client.post('/orders', payload);
    return data;
}

export async function updateOrder(orderId: string, payload: Partial<Omit<Order, 'order_id'>>): Promise<Order> {
    const { data } = await client.put(`/orders/${orderId}`, payload);
    return data;
}

export async function deleteOrder(orderId: string): Promise<void> {
    await client.delete(`/orders/${orderId}`);
}
