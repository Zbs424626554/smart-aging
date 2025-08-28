import { http } from '../utils/request';
import type { ApiResponse } from '../utils/request';
import { API_CONFIG } from '../config/api.config';

// 老人信息接口
export interface ElderlyUser {
  id: string;
  username: string;
  realname: string;
  phone: string;
  avatar: string;
  status: boolean;
  createdTime: string;
}

// 老人健康数据接口
export interface ElderlyHealthData {
  elderlyId: string;
  elderlyName: string;
  heartRate: number;
  bloodPressure: string;
  temperature: number;
  oxygenLevel: number;
  bloodSugar: number;
  lastUpdate: string;
  status: 'normal' | 'warning' | 'danger';
}

// 老人管理服务
export class ElderlyService {
  /**
   * 获取老人用户列表
   */
  static async getElderlyList(): Promise<ApiResponse<{ list: ElderlyUser[], total: number }>> {
    return http.get(API_CONFIG.USERS.GET_ELDERLY_LIST);
  }

  /**
   * 获取所有老人用户（用于绑定选择）
   */
  static async getAllElderlyUsers(): Promise<ApiResponse<{ list: ElderlyUser[], total: number }>> {
    return http.get(API_CONFIG.USERS.GET_ALL_ELDERLY_USERS);
  }

  /**
   * 获取老人健康数据
   */
  static async getElderlyHealthData(elderlyId: string): Promise<ApiResponse<ElderlyHealthData>> {
    return http.get(API_CONFIG.ELDER_HEALTH.GET_ARCHIVE(elderlyId));
  }

  /**
   * 获取老人详情
   */
  static async getElderlyDetail(elderlyId: string): Promise<ApiResponse<{ elderly: ElderlyUser }>> {
    return http.get(API_CONFIG.USERS.GET_USER_BY_ID(elderlyId));
  }

  /**
   * 获取所有老人的健康数据
   */
  static async getAllElderlyHealthData(): Promise<ApiResponse<ElderlyHealthData[]>> {
    return http.get(API_CONFIG.ELDER_HEALTH.GET_ALL_ARCHIVES);
  }

  /**
   * 创建老人用户
   */
  static async createElderly(params: {
    username: string;
    password: string;
    phone: string;
    realname: string;
    avatar?: string;
  }): Promise<ApiResponse<ElderlyUser>> {
    return http.post(API_CONFIG.AUTH.CREATE_ELDERLY, {
      ...params,
      role: 'elderly'
    });
  }

  /**
   * 更新老人信息
   */
  static async updateElderly(elderlyId: string, data: Partial<ElderlyUser>): Promise<ApiResponse<ElderlyUser>> {
    return http.put(API_CONFIG.USERS.UPDATE_USER(elderlyId), data);
  }

  /**
   * 删除老人用户
   */
  static async deleteElderly(elderlyId: string): Promise<ApiResponse<null>> {
    return http.delete(API_CONFIG.USERS.DELETE_USER(elderlyId));
  }

  /**
   * 绑定老人用户
   */
  static async bindElderly(params: {
    username: string;
  }): Promise<ApiResponse<ElderlyUser>> {
    return http.post(API_CONFIG.USERS.BIND_ELDERLY, params);
  }

  /**
   * 解绑老人用户
   */
  static async unbindElderly(elderlyId: string): Promise<ApiResponse<ElderlyUser>> {
    return http.delete(API_CONFIG.USERS.UNBIND_ELDERLY(elderlyId));
  }

  /**
   * 测试接口 - 获取所有用户（用于调试）
   */
  static async testGetAllUsers(): Promise<ApiResponse<any>> {
    return http.get('/users/test-all');
  }
}
