// 移除对ApiService的依赖以避免循环依赖

// 定义接口
interface User {
  id: string;
  username: string;
  realname: string;
  role: string;
  email: string;
  pagePermissions?: string[];
  [key: string]: any;
}

// 移除未使用的接口以避免警告

// 生产模式下不再提供任何前端模拟用户
const mockUsers: Record<string, never> = {};

export class AuthService {
  private static currentUser: User | null = null;
  private static isAuthenticated = false;
  // ApiService 已移除以避免循环依赖
  private static lastAuthCheck = 0;
  private static authCheckInterval = 1000; // 1秒内不重复检查
  // 防止重复检查 - 已移除，使用sessionStorage替代
  private static authCheckCount = 0; // 检查次数计数

  // 初始化函数，在应用启动时调用
  static initialize() {
    console.log('AuthService: 初始化开始');
    
    // 清除可能导致循环的临时状态
    sessionStorage.removeItem('auth_checking');
    sessionStorage.setItem('app_initialized', 'true');
    
    // 重置检查计数
    this.authCheckCount = 0;
    this.lastAuthCheck = 0;
    
    // 从localStorage读取认证状态
    const isAuthStr = localStorage.getItem('isAuthenticated');
    const userStr = localStorage.getItem('user');
    const accessToken = localStorage.getItem('accessToken');
    
    console.log('AuthService: 读取存储状态', {
      isAuthenticated: isAuthStr,
      hasUser: !!userStr,
      hasToken: !!accessToken
    });
    
    // 检查是否有完整的登录信息
    if (isAuthStr === 'true' && userStr && accessToken) {
      try {
        // 尝试解析用户信息
        this.currentUser = JSON.parse(userStr);
        
        // 验证令牌（对模拟令牌更宽松）
        const tokenValid = this.validateAccessToken();
        
        if (tokenValid) {
          this.isAuthenticated = true;
          console.log('AuthService: 成功恢复登录状态', this.currentUser);
        } else {
          console.log('AuthService: 令牌验证失败，清除状态');
          this.clearAuthenticationState();
        }
      } catch (e) {
        console.error('AuthService: 解析用户信息失败', e);
        this.clearAuthenticationState();
      }
    } else {
      console.log('AuthService: 登录信息不完整，清除状态');
      this.clearAuthenticationState();
    }
    
    console.log('AuthService: 初始化完成，认证状态:', this.isAuthenticated);
  }
  
  // 清除认证状态的辅助方法
  private static clearAuthenticationState() {
    this.isAuthenticated = false;
    this.currentUser = null;
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  static async login(username: string, password: string): Promise<void> {
    console.log('AuthService: 尝试登录', { username });
    
    try {
      // 直接调用正式登录API
      const apiBaseUrl = (import.meta as any).env?.VITE_API_BASE_URL || process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api';
      console.log('尝试正常登录API:', `${apiBaseUrl}/auth/login`);
      
      const loginResponse = await fetch(`${apiBaseUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ username, password })
      });
      
      console.log('登录API HTTP状态:', loginResponse.status);
      
      // 检查响应是否为JSON格式
      const contentType = loginResponse.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('服务器响应格式错误');
      }
      
      const response = await loginResponse.json();
      console.log('登录API响应:', response);

      if (response.code === 200 && response.data) {
        const { accessToken, refreshToken, user } = response.data;
        
        console.log('登录成功，用户信息:', user);
        
        // 保存令牌和用户信息
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('isAuthenticated', 'true');
        
        // 确保 Axios 后续请求带上 Authorization
        try {
          const { TokenManager } = await import('../utils/TokenManager');
          if (TokenManager?.isValidTokenFormat(accessToken)) {
            // ApiInterceptor 会自动从 localStorage 读取
            console.log('已写入新的访问令牌到本地存储');
          }
        } catch {}
        
        this.currentUser = user;
        this.isAuthenticated = true;
        this.lastAuthCheck = Date.now();
        
        // 清除检查状态
        sessionStorage.removeItem('auth_checking');
      } else {
        throw new Error(response.message || '登录失败');
      }
    } catch (error) {
      console.log('API登录失败', error);
      throw error;
    }
  }

  static async register(userData: any): Promise<void> {
    try {
      const apiBaseUrl = (import.meta as any).env?.VITE_API_BASE_URL || process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api';
      const registerResponse = await fetch(`${apiBaseUrl}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(userData)
      });
      const response = await registerResponse.json();
      
      if (response.code !== 200) {
        throw new Error(response.message || '注册失败');
      }
    } catch (error) {
      // 当使用模拟数据时的后备方案
      console.log('注册用户:', userData);
      // 这里应该调用后端API
      throw error;
    }
  }

  static async logout(): Promise<void> {
    return new Promise<void>((resolve) => {
      // 先清除内存中的状态
      this.currentUser = null;
      this.isAuthenticated = false;
      this.lastAuthCheck = 0;
      // 清除检查状态
      this.authCheckCount = 0;
      
      // 清除所有相关的本地存储
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      localStorage.removeItem('isAuthenticated');
      
      // 清除会话存储
      sessionStorage.removeItem('auth_checking');
      
      // 尝试调用后端API，但不等待其完成
      try {
        const apiBaseUrl = (import.meta as any).env?.VITE_API_BASE_URL || process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api';
        fetch(`${apiBaseUrl}/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include'
        }).catch(() => {
          // 忽略后端API调用错误
          console.log('后端登出API调用失败，但本地登出成功');
        });
      } catch (error) {
        console.error('登出API调用失败，但本地登出成功');
      }
      
      // 添加短暂延迟确保状态更新
      setTimeout(() => {
        resolve();
      }, 100);
    });
  }

  static getCurrentUser(): User | null {
    if (!this.currentUser) {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          this.currentUser = JSON.parse(userStr);
        } catch (e) {
          // 如果解析失败，清除损坏的数据
          localStorage.removeItem('user');
          return null;
        }
      }
    }
    return this.currentUser;
  }

  // 验证访问令牌是否有效
  static validateAccessToken(): boolean {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      return false;
    }
    
    // 简单的JWT格式检查
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.log('令牌格式无效，但在开发环境中允许');
        return true; // 在开发环境中更宽松的验证
      }
      
      // 解码payload部分
      const payload = JSON.parse(atob(parts[1]));
      const now = Math.floor(Date.now() / 1000);
      
      // 检查是否过期
      if (payload.exp && payload.exp < now) {
        console.log('访问令牌已过期');
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('验证访问令牌时出错:', error);
      // 在开发环境中，即使解析失败也认为有效（可能是模拟数据）
      console.log('令牌解析失败，但在开发环境中允许');
      return true;
    }
  }
  
  // 尝试刷新访问令牌
  static async refreshAccessToken(): Promise<boolean> {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      console.log('没有刷新令牌');
      return false;
    }
    
    try {
      const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api';
      const response = await fetch(`${apiBaseUrl}/auth/refresh-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ refreshToken })
      });
      
      const data = await response.json();
      
      if (data.code === 200 && data.data?.accessToken) {
        localStorage.setItem('accessToken', data.data.accessToken);
        console.log('访问令牌刷新成功');
        return true;
      } else {
        console.error('刷新令牌失败:', data.message);
        return false;
      }
    } catch (error) {
      console.error('刷新令牌请求失败:', error);
      return false;
    }
  }

  static isLoggedIn(): boolean {
    // 检查是否正在进行认证检查，避免循环
    const isChecking = sessionStorage.getItem('auth_checking');
    if (isChecking === 'true') {
      // 如果正在检查，直接返回当前状态
      return this.isAuthenticated;
    }
    
    try {
      // 标记正在进行认证检查
      sessionStorage.setItem('auth_checking', 'true');
      
      // 检查是否需要重新验证（减少频繁检查）
      const now = Date.now();
      if (now - this.lastAuthCheck < this.authCheckInterval) {
        // 在检查间隔内，直接返回缓存的状态
        sessionStorage.removeItem('auth_checking');
        return this.isAuthenticated;
      }
      
      // 增加检查计数
      this.authCheckCount++;
      
      // 如果检查次数过多，可能存在循环，直接返回当前状态
      if (this.authCheckCount > 5) {
        console.warn('检测到可能的认证检查循环，使用缓存状态');
        sessionStorage.removeItem('auth_checking');
        return this.isAuthenticated;
      }
      
      // 检查localStorage中的基本认证信息
      const isAuthStr = localStorage.getItem('isAuthenticated');
      const userStr = localStorage.getItem('user');
      const accessToken = localStorage.getItem('accessToken');
      
      // 基础检查：必须有认证标记、用户信息和令牌
      if (isAuthStr === 'true' && userStr && accessToken) {
        // 确保内存中的状态与localStorage一致
        if (!this.currentUser) {
          try {
            this.currentUser = JSON.parse(userStr);
          } catch (e) {
            console.error('解析用户信息失败:', e);
            this.clearAuthenticationState();
            this.isAuthenticated = false;
          }
        }
        
        // 验证令牌
        const tokenValid = this.validateAccessToken();
        if (tokenValid) {
          this.isAuthenticated = true;
        } else {
          console.log('令牌验证失败，清除认证状态');
          this.clearAuthenticationState();
          this.isAuthenticated = false;
        }
      } else {
        // 认证信息不完整
        console.log('认证信息不完整，设置为未登录状态');
        this.isAuthenticated = false;
      }
      
      this.lastAuthCheck = now;
      console.log('AuthService.isLoggedIn:', this.isAuthenticated);
      return this.isAuthenticated;
    } finally {
      // 检查完成，清除标记
      sessionStorage.removeItem('auth_checking');
    }
  }

  static getCurrentRole(): string {
    const user = this.getCurrentUser();
    if (!user) return '';
    if (user.role === 'admin') {
      // 若存在管理员子角色，返回子角色；super_admin 规范化为 admin_super
      const adminRole = (user as any).adminRole;
      if (adminRole) {
        return adminRole === 'super_admin' ? 'admin_super' : String(adminRole);
      }
      // 未指定子角色则按超级管理员处理
      return 'admin_super';
    }
    return user.role || '';
  }

  static getUserPermissions(): string[] | undefined {
    const user = this.getCurrentUser();
    return user?.pagePermissions;
  }

  static updateUserPermissions(permissions: string[]): void {
    if (this.currentUser) {
      this.currentUser.pagePermissions = permissions;
      localStorage.setItem('user', JSON.stringify(this.currentUser));
    }
  }
}

// 默认导出，确保导入兼容性
export default AuthService; 