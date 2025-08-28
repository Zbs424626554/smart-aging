import { http } from '../utils/request';
import type { ApiResponse } from '../utils/request';

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
  username?: string;
  phone?: string;
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
   * 检查是否已登录
   */
  static isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
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
} 