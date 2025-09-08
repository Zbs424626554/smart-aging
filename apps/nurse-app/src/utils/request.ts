import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { message } from 'antd';

// 响应数据接口
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
}

// 请求配置接口
export interface RequestConfig extends AxiosRequestConfig {
  showError?: boolean; // 是否显示错误信息
  showSuccess?: boolean; // 是否显示成功信息
}

// 获取API基础URL
const getApiBaseUrl = () => {
  // 在浏览器环境中，使用import.meta.env（Vite）或window.location
  if (typeof window !== 'undefined') {
    // 开发环境
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:3001/api';
    }
    // 生产环境
    return '/api';
  }
  // 服务端环境
  return process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api';
};

// 创建axios实例
const request: AxiosInstance = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    // 添加token到请求头
    const token = localStorage.getItem('token');
    const hasExplicitAuth = !!(config.headers && (config.headers as any)['Authorization']);
    if (!hasExplicitAuth && token) {
      (config.headers as any).Authorization = `Bearer ${token}`;
    }

    // 添加用户角色信息
    const userRole = localStorage.getItem('userRole');
    if (userRole) {
      (config.headers as any)['X-User-Role'] = userRole;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
request.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    const { data } = response;
    const cfg = (response.config || {}) as RequestConfig;
    const shouldShowError = cfg.showError !== false;
    const shouldShowSuccess = cfg.showSuccess === true;

    // 处理业务错误
    if (data.code !== 200) {
      if (shouldShowError) {
        switch (data.code) {
          case 401:
            localStorage.removeItem('token');
            localStorage.removeItem('userRole');
            localStorage.removeItem('userInfo');
            window.location.href = '/login';
            break;
          case 403:
            message.error('权限不足，无法访问该功能');
            break;
          case 404:
            message.error('请求的资源不存在');
            break;
          case 500:
            message.error('服务器内部错误');
            break;
          default:
            message.error(data.message || '请求失败');
        }
      }
      return Promise.reject(new Error(data.message || '请求失败'));
    }

    if (shouldShowSuccess && data?.message) {
      message.success(data.message);
    }
    return data;
  },
  (error) => {
    const cfg = (error?.config || {}) as RequestConfig;
    const shouldShowError = cfg.showError !== false;

    // 处理网络错误
    if (error.response) {
      const { status, data } = error.response;
      if (shouldShowError) {
        switch (status) {
          case 401:
            message.error('登录已过期，请重新登录');
            localStorage.removeItem('token');
            localStorage.removeItem('userRole');
            localStorage.removeItem('userInfo');
            window.location.href = '/login';
            break;
          case 403:
            message.error('权限不足');
            break;
          case 404:
            message.error('请求的资源不存在');
            break;
          case 500:
            message.error('服务器内部错误');
            break;
          default:
            message.error(data?.message || '请求失败');
        }
      }
    } else if (error.request) {
      if (shouldShowError) message.error('网络连接失败，请检查网络设置');
    } else {
      if (shouldShowError) message.error('请求配置错误');
    }

    return Promise.reject(error);
  }
);

// 封装请求方法
export const http = {
  get: <T = any>(url: string, config?: RequestConfig): Promise<ApiResponse<T>> => {
    return request.get(url, config);
  },

  post: <T = any>(url: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>> => {
    return request.post(url, data, config);
  },

  put: <T = any>(url: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>> => {
    return request.put(url, data, config);
  },

  patch: <T = any>(url: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>> => {
    return request.patch(url, data, config);
  },

  delete: <T = any>(url: string, config?: RequestConfig): Promise<ApiResponse<T>> => {
    return request.delete(url, config);
  },
};

// 导出axios实例
export default request; 