import { authService } from '../authService';
import apiClient from '../api';

jest.mock('../api');

describe('authService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should login with credentials', async () => {
      const mockResponse = {
        success: true,
        user: { id: 1, username: 'testuser' },
      };

      (apiClient.post as jest.Mock).mockResolvedValue({ data: mockResponse });

      const result = await authService.login({
        username: 'testuser',
        password: 'password',
      });

      expect(apiClient.post).toHaveBeenCalledWith('/auth/login', {
        username: 'testuser',
        password: 'password',
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('logout', () => {
    it('should logout user', async () => {
      (apiClient.post as jest.Mock).mockResolvedValue({ data: {} });

      await authService.logout();

      expect(apiClient.post).toHaveBeenCalledWith('/auth/logout');
    });
  });

  describe('getCurrentUser', () => {
    it('should get current user when authenticated', async () => {
      const mockResponse = {
        authenticated: true,
        user: { id: 1, username: 'testuser' },
      };

      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockResponse });

      const result = await authService.getCurrentUser();

      expect(apiClient.get).toHaveBeenCalledWith('/auth/me');
      expect(result).toEqual(mockResponse);
    });

    it('should return unauthenticated when not logged in', async () => {
      const mockResponse = {
        authenticated: false,
      };

      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockResponse });

      const result = await authService.getCurrentUser();

      expect(result.authenticated).toBe(false);
    });
  });

  describe('register', () => {
    it('should register a new user', async () => {
      const mockResponse = {
        success: true,
        user: { id: 1, username: 'newuser' },
      };

      (apiClient.post as jest.Mock).mockResolvedValue({ data: mockResponse });

      const result = await authService.register({
        username: 'newuser',
        password: 'password123',
      });

      expect(apiClient.post).toHaveBeenCalledWith('/auth/register', {
        username: 'newuser',
        password: 'password123',
      });
      expect(result).toEqual(mockResponse);
    });

    it('should handle registration errors', async () => {
      const mockError = {
        response: {
          data: { error: 'Username already exists' },
        },
      };

      (apiClient.post as jest.Mock).mockRejectedValue(mockError);

      await expect(
        authService.register({
          username: 'existinguser',
          password: 'password123',
        })
      ).rejects.toEqual(mockError);
    });
  });
});
