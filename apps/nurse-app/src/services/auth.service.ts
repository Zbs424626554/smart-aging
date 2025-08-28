import { http } from '../utils/request';
import type { ApiResponse } from '../utils/request';

// 用户角色类型
export type UserRole = 'elderly' | 'family' | 'nurse' | 'admin';

// 用户信息接口
export interface UserInfo {
  _id: string;
  username: string;
  phone: string;
  role: UserRole;
  realname?: string;
  avatar?: string;
  status: boolean;
  createdAt: string;
  updatedAt: string;
}

// 登录参数接口
export interface LoginParams {
  phone: string;
  password: string;
}

// 注册参数接口
export interface RegisterParams {
  role: UserRole;
  username: string;
  password: string;
  phone: string;
}

// 登录响应接口
export interface LoginResponse {
  token: string;
  user: UserInfo;
}

// 认证服务类
export class AuthService {
  // 登录
  static async login(params: LoginParams): Promise<ApiResponse<LoginResponse>> {
    return http.post<LoginResponse>('/auth/login', params);
  }

  // 注册
  static async register(params: RegisterParams): Promise<ApiResponse<LoginResponse>> {
    return http.post<LoginResponse>('/auth/register', params);
  }

  // 保存用户信息到本地存储
  static saveUserInfo(token: string, user: UserInfo): void {
    localStorage.setItem('token', token);
    localStorage.setItem('userRole', user.role);
    localStorage.setItem('userInfo', JSON.stringify(user));
  }

  // 获取当前用户信息
  static getCurrentUser(): UserInfo | null {
    const userInfo = localStorage.getItem('userInfo');
    return userInfo ? JSON.parse(userInfo) : null;
  }

  // 获取当前用户角色
  static getCurrentRole(): UserRole | null {
    return localStorage.getItem('userRole') as UserRole | null;
  }

  // 检查是否已登录
  static isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  // 退出登录
  static logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userInfo');
  }

  // 获取token
  static getToken(): string | null {
    return localStorage.getItem('token');
  }
} 