import apiClient from './api';

export interface ThresholdResponse {
  threshold: number;
}

export const settingsService = {
  getThreshold: async (): Promise<number> => {
    const response = await apiClient.get<ThresholdResponse>('/settings/threshold');
    return response.data.threshold;
  },

  updateThreshold: async (threshold: number): Promise<{ success: boolean; threshold: number }> => {
    const response = await apiClient.put<{ success: boolean; threshold: number }>(
      '/settings/threshold',
      { threshold }
    );
    return response.data;
  },
};
