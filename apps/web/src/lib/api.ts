import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const authData = localStorage.getItem('flowraze-auth');
  if (authData) {
    try {
      const { state } = JSON.parse(authData);
      if (state?.token) {
        config.headers.Authorization = `Bearer ${state.token}`;
      }
    } catch {
      // ignore parse errors
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('flowraze-auth');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

export async function get<T>(url: string): Promise<ApiResponse<T>> {
  try {
    const response = await api.get<ApiResponse<T>>(url);
    return response.data;
  } catch (error: unknown) {
    const err = error as { response?: { data?: { error?: string } }; message?: string };
    return {
      success: false,
      error: err.response?.data?.error || err.message || 'An error occurred',
    };
  }
}

export async function post<T>(url: string, data: unknown): Promise<ApiResponse<T>> {
  try {
    const response = await api.post<ApiResponse<T>>(url, data);
    return response.data;
  } catch (error: unknown) {
    const err = error as { response?: { data?: { error?: string } }; message?: string };
    return {
      success: false,
      error: err.response?.data?.error || err.message || 'An error occurred',
    };
  }
}

export async function put<T>(url: string, data: unknown): Promise<ApiResponse<T>> {
  try {
    const response = await api.put<ApiResponse<T>>(url, data);
    return response.data;
  } catch (error: unknown) {
    const err = error as { response?: { data?: { error?: string } }; message?: string };
    return {
      success: false,
      error: err.response?.data?.error || err.message || 'An error occurred',
    };
  }
}

export async function del<T>(url: string): Promise<ApiResponse<T>> {
  try {
    const response = await api.delete<ApiResponse<T>>(url);
    return response.data;
  } catch (error: unknown) {
    const err = error as { response?: { data?: { error?: string } }; message?: string };
    return {
      success: false,
      error: err.response?.data?.error || err.message || 'An error occurred',
    };
  }
}
