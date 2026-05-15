import client from './client';
import type { Order } from '@/types/api';

export async function listOrders(): Promise<Order[]> {
    const { data } = await client.get('/orders');
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
