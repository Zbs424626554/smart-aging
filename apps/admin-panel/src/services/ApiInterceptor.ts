import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig, AxiosHeaders } from 'axios';
import { getApiEndpointsByRole } from '../config/permissions';
import { TokenManager } from '../utils/TokenManager';
import { message } from 'antd';

class ApiInterceptor {
  private static instance: ApiInterceptor;
  private axiosInstance: AxiosInstance;

  private constructor() {
    // 获取API基础URL，优先使用 Vite 环境变量；开发环境默认走 /api（由Vite代理到后端）
    const isDev = (import.meta as any).env?.DEV;
    const apiBaseUrl = (import.meta as any).env?.VITE_API_BASE_URL
      ?? process.env.REACT_APP_API_BASE_URL
      ?? (isDev ? '/api' : 'http://localhost:3001/api');
    console.log('API基础URL:', apiBaseUrl);
    
    this.axiosInstance = axios.create({
      baseURL: apiBaseUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true, // 允许跨域请求携带凭证
    });

    this.setupInterceptors();
  }

  public static getInstance(): ApiInterceptor {
    if (!ApiInterceptor.instance) {
      ApiInterceptor.instance = new ApiInterceptor();
    }
    return ApiInterceptor.instance;
  }

  private setupInterceptors(): void {
    // 请求拦截器
    this.axiosInstance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        console.log('发送请求:', config.method, config.url);
        
        // 添加认证令牌
        const token = localStorage.getItem('accessToken');
        if (token && TokenManager.isValidTokenFormat(token)) {
          // 检查令牌是否即将过期，如果是则在后台刷新
          if (TokenManager.isTokenExpiringSoon(token)) {
            console.log('令牌即将过期，在后台刷新');
            TokenManager.refreshAccessToken().catch(error => {
              console.error('后台刷新令牌失败:', error);
            });
          }
          
          if (!config.headers) {
            config.headers = new AxiosHeaders();
          }
          config.headers.set('Authorization', `Bearer ${token}`);
          console.log('添加认证令牌');
        } else {
          console.log('没有有效的访问令牌');
        }

        // 权限检查
        if (config.url && config.method) {
          const currentRole = this.getCurrentRole();
          // 管理员与超级管理员跳过API权限校验，直接放行
          if (currentRole === 'admin_super' || currentRole === 'admin') {
            return config;
          }
          const allowedEndpoints = getApiEndpointsByRole(currentRole);
          
          // 规范化出完整路径（包含 /api 前缀），用于权限判定
          // 注意：axios 的 baseURL 在开发环境可能是相对路径（如 '/api'），
          // 直接使用 new URL(baseURL) 会在浏览器报 Invalid URL。
          const basePath = (() => {
            const base = (config.baseURL || '') as string;
            if (!base) return '';
            try {
              // 传入 window.location.origin 以支持相对路径
              const u = new URL(base, window.location.origin);
              return u.pathname.replace(/\/+$/,'');
            } catch {
              // 兜底：若本身就是路径（例如 '/api'），直接返回规范化后的路径
              if (typeof base === 'string' && base.startsWith('/')) {
                return base.replace(/\/+$/,'');
              }
              return '';
            }
          })();
          const urlPath = (config.url || '').startsWith('/') ? (config.url as string) : `/${config.url}`;
          const fullPath = `${basePath}${urlPath}`.replace(/\/{2,}/g,'/');
          const method = (config.method || 'GET').toUpperCase();
          const endpoint = `${method} ${fullPath}`;
          
          // 检查是否有权限访问此API
          const hasPermission = this.checkApiPermission(endpoint, allowedEndpoints);
          
          if (!hasPermission) {
            // 取消请求并显示错误信息
            // 放宽开发环境的严格检查，避免误杀
            if (process.env.NODE_ENV === 'production') {
              const error = new Error(`无权访问API: ${endpoint}`);
              message.error(`权限不足，无法执行此操作`);
              return Promise.reject(error);
            }
          }
        }

        return config;
      },
      (error) => {
        console.error('请求错误:', error);
        return Promise.reject(error);
      }
    );

    // 响应拦截器
    this.axiosInstance.interceptors.response.use(
      (response: AxiosResponse) => {
        console.log('收到响应:', response.config.url, response.status, response.data);
        
        // 检查响应格式
        if (response.data && typeof response.data === 'object') {
          // 检查是否符合统一响应格式
          if ('code' in response.data && 'status' in response.data && 'message' in response.data) {
            // 统一处理错误码
            if (response.data.code !== 200) {
              message.error(response.data.message || '操作失败');
            }
          }
        }
        
        return response;
      },
      async (error) => {
        console.error('响应错误:', error);
        
        // 提取服务器返回的错误信息（尽量还原后端的 message）
        const extractServerMessage = async (): Promise<string | null> => {
          try {
            const resp = error.response;
            if (!resp) return null;
            // 先从响应头尝试提取
            try {
              const hdrs: any = resp.headers;
              const getFn = hdrs && typeof hdrs.get === 'function' ? hdrs.get.bind(hdrs) : null;
              const headerMsg = getFn
                ? (getFn('x-error-message') || getFn('x-message') || getFn('x-api-message'))
                : (hdrs?.['x-error-message'] || hdrs?.['x-message'] || hdrs?.['x-api-message']);
              if (headerMsg) return String(headerMsg);
            } catch {}
            const data = resp.data;
            if (!data) return null;
            if (typeof data === 'string') {
              try {
                const parsed = JSON.parse(data);
                return parsed?.message || parsed?.error || parsed?.msg || null;
              } catch {
                return data.length > 500 ? data.slice(0, 500) : data;
              }
            }
            // Blob 或 ArrayBuffer
            if (data instanceof Blob) {
              const text = await data.text();
              try {
                const parsed = JSON.parse(text);
                return parsed?.message || parsed?.error || parsed?.msg || null;
              } catch {
                const t = text || '';
                return t.length > 500 ? t.slice(0, 500) : t;
              }
            }
            if (data && typeof data === 'object') {
              // 标准统一响应或常见字段
              return data.message || data.error || data.msg || null;
            }
            return null;
          } catch {
            return null;
          }
        };

        if (error.response) {
          console.log('错误响应状态:', error.response.status);
          console.log('错误响应数据:', error.response.data);
          
          // 处理401/403错误（未授权/令牌过期）
          if (error.response.status === 401 || error.response.status === 403) {
            const serverMsg = await extractServerMessage();
            const errorMessage = serverMsg || '访问令牌无效或已过期';
            console.log('认证错误:', errorMessage);
            
            // 如果是令牌相关错误，尝试刷新令牌
            if (errorMessage.includes('令牌') || errorMessage.includes('token') || 
                errorMessage.includes('过期') || errorMessage.includes('无效')) {
              
              if (!error.config._retry) {
                console.log('尝试刷新令牌');
                error.config._retry = true; // 防止无限循环
                
                try {
                  const refreshSuccess = await TokenManager.refreshAccessToken();
                  
                  if (refreshSuccess) {
                    const newToken = localStorage.getItem('accessToken');
                    console.log('令牌刷新成功，重试原始请求');
                    
                    // 更新原始请求的Authorization头
                    if (!error.config.headers) {
                      error.config.headers = new AxiosHeaders();
                    }
                    if (newToken) {
                      error.config.headers.set('Authorization', `Bearer ${newToken}`);
                    }
                    
                    // 重试原始请求
                    return this.axiosInstance(error.config);
                  } else {
                    throw new Error('刷新令牌失败');
                  }
                } catch (refreshError) {
                  console.error('刷新令牌失败:', refreshError);
                  
                  // 刷新失败，清除所有认证信息并跳转登录
                  TokenManager.clearAllTokens();
                  
                  message.error('登录已过期，请重新登录');
                  setTimeout(() => {
                    window.location.href = '/login';
                  }, 1000);
                  
                  return Promise.reject(refreshError);
                }
              } else {
                // 已经重试过，直接跳转登录
                console.log('已重试刷新令牌，跳转登录页面');
                TokenManager.clearAllTokens();
                message.error('登录已过期，请重新登录');
                setTimeout(() => {
                  window.location.href = '/login';
                }, 1000);
              }
            } else {
              // 其他403错误（权限不足）
              message.error(serverMsg || '权限不足，无法执行此操作');
            }
          }
          

          
          // 处理500错误（服务器错误）
          if (error.response.status === 500) {
            const serverMsg = await extractServerMessage();
            message.error(serverMsg || '服务器错误，请稍后重试');
          }
          
          // 其他状态码：尽量显示服务器的 message
          if (![401, 403, 500].includes(error.response.status)) {
            const serverMsg = await extractServerMessage();
            if (serverMsg) {
              message.error(serverMsg);
            }
          }
        } else if (error.request) {
          // 请求已发送但没有收到响应
          console.error('没有收到响应:', error.request);
          message.error('网络错误，无法连接到服务器');
        } else {
          // 请求配置出错
          console.error('请求配置错误:', error.message);
          message.error('请求错误: ' + error.message);
        }
        
        return Promise.reject(error);
      }
    );
  }

  // 获取当前用户角色
  private getCurrentRole(): string {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        // 如果是平台管理员，使用管理员子角色进行权限判定
        if (user.role === 'admin' && user.adminRole) {
          return user.adminRole;
        }
        return user.role || '';
      }
    } catch (error) {
      console.error('获取用户角色失败:', error);
    }
    return '';
  }

  // 检查API权限
  private checkApiPermission(endpoint: string, allowedEndpoints: string[]): boolean {
    // 如果是超级管理员，允许所有访问
    if (this.getCurrentRole() === 'admin_super') {
      return true;
    }

    // 解析当前端点
    const [endpointMethod, endpointFull] = (() => {
      const parts = endpoint.split(/\s+/);
      const m = (parts[0] || 'GET').toUpperCase();
      const p = (parts[1] || '').split('?')[0];
      return [m, p] as const;
    })();

    // 允许规则：
    // - 精确匹配：METHOD /path
    // - 路径带参数：METHOD /path/:id
    // - 前缀通配：METHOD /path/*
    return allowedEndpoints.some(rule => {
      const [ruleMethodRaw, rulePathRaw] = rule.split(/\s+/);
      const ruleMethod = (ruleMethodRaw || 'GET').toUpperCase();
      const rulePath = (rulePathRaw || '').split('?')[0];

      // 方法匹配（支持 * 通配方法）
      if (!(ruleMethod === '*' || ruleMethod === endpointMethod)) return false;

      // 快速路径相等
      if (rulePath === endpointFull) return true;

      // 通配后缀
      if (rulePath.endsWith('/*')) {
        const prefix = rulePath.slice(0, -2);
        return endpointFull.startsWith(prefix);
      }

      // 动态段 :param 匹配
      const ruleSegs = rulePath.split('/').filter(Boolean);
      const endSegs = endpointFull.split('/').filter(Boolean);
      if (ruleSegs.length !== endSegs.length) return false;
      for (let i = 0; i < ruleSegs.length; i++) {
        const r = ruleSegs[i];
        const e = endSegs[i];
        if (r.startsWith(':')) continue; // 参数占位匹配任意
        if (r !== e) return false;
      }
      return true;
    });
  }

  // 公共方法，用于发送请求
  public request<T = any>(config: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.axiosInstance.request<T>(config);
  }

  public get<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.axiosInstance.get<T>(url, config);
  }

  public post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.axiosInstance.post<T>(url, data, config);
  }

  public put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.axiosInstance.put<T>(url, data, config);
  }

  public delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.axiosInstance.delete<T>(url, config);
  }
}

export default ApiInterceptor.getInstance(); 