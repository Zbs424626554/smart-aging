import type { ApiResponse } from '../utils/request';
import { http } from '../utils/request';

// 用户角色类型
export type UserRole = 'elderly' | 'family' | 'nurse' | 'admin';

// 用户信息接口
export interface UserInfo {
  id: string;
  username: string;
  phone: string;
  role: UserRole;
  avatar?: string;
  realname?: string;
  status: boolean;
  createdTime: string;
}

// 登录请求参数
export interface LoginParams {
  phone: string;
  password: string;
}

// 注册请求参数
export interface RegisterParams {
  role: UserRole;
  username: string;
  password: string;
  phone: string;
  avatar?: string;
}

// 登录响应
export interface LoginResponse {
  token: string;
  user: UserInfo;
}

// 创建老人用户参数
export interface CreateElderlyParams {
  username: string;
  password: string;
  phone: string;
  realname: string;
  avatar?: string;
}

// 认证服务类
export class AuthService {
  /**
   * 用户注册
   */
  static async register(params: RegisterParams): Promise<ApiResponse<LoginResponse>> {
    return http.post('/auth/register', params);
  }

  /**
   * 用户登录
   */
  static async login(params: LoginParams): Promise<ApiResponse<LoginResponse>> {
    return http.post('/auth/login', params);
  }

  /**
   * 获取用户信息
   */
  static async getProfile(): Promise<ApiResponse<UserInfo>> {
    return http.get('/auth/profile');
  }

  /**
   * 更新用户信息
   */
  static async updateProfile(data: Partial<UserInfo>): Promise<ApiResponse<UserInfo>> {
    return http.put('/auth/profile', data);
  }

  /**
   * 退出登录
   */
  static logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userInfo');
    window.location.href = '/login';
  }

  /**
   * 是否存在本地token（同步）
   */
  static hasToken(): boolean {
    return !!localStorage.getItem('token');
  }

  /**
   * 检查是否已登录（优先检查本地token，其次调用 /auth/profile 校验）
   */
  static async isLoggedIn(): Promise<boolean> {
    if (this.hasToken()) return true;
    try {
      const res: any = await http.get('/auth/profile');
      // 兼容不同响应结构
      if (res?.code === 200) return true;
      if (res?.data && (res as any).status === 200) return true;
      return false;
    } catch {
      return false;
    }
  }

  /**
   * 获取当前用户角色
   */
  static getCurrentRole(): UserRole | null {
    return localStorage.getItem('userRole') as UserRole | null;
  }

  /**
   * 获取当前用户信息
   */
  static getCurrentUser(): UserInfo | null {
    const userInfo = localStorage.getItem('userInfo');
    return userInfo ? JSON.parse(userInfo) : null;
  }

  /**
   * 保存用户信息到本地存储
   */
  static saveUserInfo(token: string, user: UserInfo): void {
    localStorage.setItem('token', token);
    localStorage.setItem('userRole', user.role);
    localStorage.setItem('userInfo', JSON.stringify(user));
  }

  /**
   * 创建老人用户（家属端添加老人）
   */
  static async createElderly(params: CreateElderlyParams): Promise<ApiResponse<UserInfo>> {
    return http.post('/auth/create-elderly', {
      ...params,
      role: 'elderly'
    });
  }

  /**
   * 获取老人用户列表
   */
  static async getElderlyList(): Promise<ApiResponse<{ list: UserInfo[], total: number }>> {
    return http.get('/users/role/elderly');
  }
}
