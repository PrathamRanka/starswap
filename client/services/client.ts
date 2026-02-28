import axios from 'axios';
import { ApiResult } from '../types/api';

const apiClient = axios.create({
  baseURL: '/api',
  withCredentials: true, // Crucial for Express session cookie (connect.sid)
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor to normalize the API output to our generic ApiResult type
apiClient.interceptors.response.use(
  (response) => {
    return response.data; // Return the exact ApiResponse structure
  },
  (error) => {
    // If we have a standardized error response, return it properly instead of throwing
    if (error.response && error.response.data && 'success' in error.response.data) {
      return Promise.reject(error.response.data);
    }
    
    // Fallback for network errors or unhandled cases
    return Promise.reject({
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error.message || 'An unexpected error occurred',
      }
    });
  }
);

/**
 * Generic fetcher that enforces our return types.
 */
export async function get<T>(url: string, config = {}): Promise<ApiResult<T>> {
  try {
    const response = await apiClient.get<ApiResult<T>>(url, config);
    return response as unknown as ApiResult<T>; // Interceptor handles data unwrapping
  } catch (error) {
    return error as ApiResult<T>;
  }
}

export async function post<T>(url: string, data = {}, config = {}): Promise<ApiResult<T>> {
  try {
    const response = await apiClient.post<ApiResult<T>>(url, data, config);
    return response as unknown as ApiResult<T>;
  } catch (error) {
    return error as ApiResult<T>;
  }
}

export async function patch<T>(url: string, data = {}, config = {}): Promise<ApiResult<T>> {
  try {
    const response = await apiClient.patch<ApiResult<T>>(url, data, config);
    return response as unknown as ApiResult<T>;
  } catch (error) {
    return error as ApiResult<T>;
  }
}

export default apiClient;
