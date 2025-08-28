import { http } from '../utils/request';
import type { ApiResponse } from '../utils/request';
import { API_CONFIG } from '../config/api.config';

// 健康数据接口
export interface HealthData {
  id: string;
  elderlyId: string;
  elderlyName: string;
  heartRate: number;
  bloodPressure: string;
  temperature: number;
  oxygenLevel: number;
  bloodSugar: number;
  lastUpdate: string;
  status: 'normal' | 'warning' | 'danger';
  notes?: string;
}

// 健康记录接口
export interface HealthRecord {
  id: string;
  elderlyId: string;
  recordType: 'daily' | 'weekly' | 'monthly';
  recordDate: string;
  data: HealthData;
  doctorNotes?: string;
  recommendations?: string[];
}

// 健康服务
export class HealthService {
  /**
   * 获取老人的健康数据
   */
  static async getHealthData(elderlyId: string): Promise<ApiResponse<HealthData>> {
    return http.get(API_CONFIG.HEALTH.GET_LATEST_DATA(elderlyId));
  }

  /**
   * 获取老人的健康历史记录
   */
  static async getHealthHistory(elderlyId: string, limit: number = 30): Promise<ApiResponse<HealthRecord[]>> {
    return http.get(API_CONFIG.HEALTH.GET_HISTORY(elderlyId) + `?limit=${limit}`);
  }

  /**
   * 创建健康记录
   */
  static async createHealthRecord(data: Omit<HealthData, 'id' | 'lastUpdate'>): Promise<ApiResponse<HealthData>> {
    return http.post(API_CONFIG.HEALTH.CREATE_RECORD, data);
  }

  /**
   * 更新健康记录
   */
  static async updateHealthRecord(recordId: string, data: Partial<HealthData>): Promise<ApiResponse<HealthData>> {
    return http.put(API_CONFIG.HEALTH.UPDATE_RECORD(recordId), data);
  }

  /**
   * 获取健康统计
   */
  static async getHealthStats(elderlyId: string, period: 'week' | 'month' | 'year' = 'month'): Promise<ApiResponse<{
    averageHeartRate: number;
    averageBloodPressure: string;
    averageTemperature: number;
    averageBloodSugar: number;
    trends: {
      heartRate: number[];
      bloodPressure: string[];
      temperature: number[];
      bloodSugar: number[];
      dates: string[];
    };
  }>> {
    return http.get(API_CONFIG.HEALTH.GET_STATS(elderlyId) + `?period=${period}`);
  }

  /**
   * 获取健康警告
   */
  static async getHealthWarnings(elderlyId: string): Promise<ApiResponse<{
    warnings: Array<{
      type: 'heartRate' | 'bloodPressure' | 'temperature' | 'bloodSugar';
      level: 'warning' | 'danger';
      message: string;
      timestamp: string;
    }>;
  }>> {
    return http.get(API_CONFIG.HEALTH.GET_WARNINGS(elderlyId));
  }
}
