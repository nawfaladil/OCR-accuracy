import apiClient from './api';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface User {
  id: number;
  username: string;
}

export interface AuthResponse {
  success: boolean;
  user: User;
}

export const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
    return response.data;
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
  },

  getCurrentUser: async (): Promise<{ authenticated: boolean; user?: User }> => {
    const response = await apiClient.get<{ authenticated: boolean; user?: User }>('/auth/me');
    return response.data;
  },

  register: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/register', credentials);
    return response.data;
  },
};
