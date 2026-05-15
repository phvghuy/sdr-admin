import client from './client'
import type { LoginResponse } from '../types/api';

export async function login(email: string, password: string) {
  const { data } = await client.post('/auth/login', { email, password })
  return data as LoginResponse;
}

export async function logout(): Promise<void> {
  await client.post('/auth/logout');
}
