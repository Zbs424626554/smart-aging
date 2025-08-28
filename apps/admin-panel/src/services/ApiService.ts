import ApiInterceptor from './ApiInterceptor';

export class ApiService {
  private static instance: ApiService;
  private baseUrl: string;

  private constructor() {
    this.baseUrl = process.env.REACT_APP_API_BASE_URL || '/api';
  }

  public static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  // 通用GET请求
  public async get<T>(endpoint: string, params?: any): Promise<T> {
    try {
      const response = await ApiInterceptor.get(`${endpoint}`, { params });
      return response.data;
    } catch (error) {
      console.error(`GET请求失败: ${endpoint}`, error);
      throw error;
    }
  }

  // 通用POST请求
  public async post<T>(endpoint: string, data?: any): Promise<T> {
    try {
      const response = await ApiInterceptor.post(`${endpoint}`, data);
      return response.data;
    } catch (error) {
      console.error(`POST请求失败: ${endpoint}`, error);
      throw error;
    }
  }

  // 通用PUT请求
  public async put<T>(endpoint: string, data?: any): Promise<T> {
    try {
      const response = await ApiInterceptor.put(`${endpoint}`, data);
      return response.data;
    } catch (error) {
      console.error(`PUT请求失败: ${endpoint}`, error);
      throw error;
    }
  }

  // 通用DELETE请求
  public async delete<T>(endpoint: string, params?: any): Promise<T> {
    try {
      const response = await ApiInterceptor.delete(`${endpoint}`, { params });
      return response.data;
    } catch (error) {
      console.error(`DELETE请求失败: ${endpoint}`, error);
      throw error;
    }
  }
} 