/**
 * 令牌管理工具类
 * 负责处理JWT令牌的验证、刷新和管理
 */

export class TokenManager {
  private static refreshPromise: Promise<boolean> | null = null;
  
  /**
   * 检查令牌是否即将过期（5分钟内）
   */
  static isTokenExpiringSoon(token: string): boolean {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return true; // 格式错误，认为需要刷新
      }
      
      const payload = JSON.parse(atob(parts[1]));
      const now = Math.floor(Date.now() / 1000);
      const expirationTime = payload.exp;
      
      if (!expirationTime) {
        return true; // 没有过期时间，认为需要刷新
      }
      
      // 如果在5分钟内过期，返回true
      const fiveMinutes = 5 * 60;
      return (expirationTime - now) <= fiveMinutes;
    } catch (error) {
      console.error('检查令牌过期时间时出错:', error);
      return true; // 解析失败，认为需要刷新
    }
  }
  
  /**
   * 检查令牌是否已过期
   */
  static isTokenExpired(token: string): boolean {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return true;
      }
      
      const payload = JSON.parse(atob(parts[1]));
      const now = Math.floor(Date.now() / 1000);
      
      return payload.exp && payload.exp < now;
    } catch (error) {
      console.error('检查令牌是否过期时出错:', error);
      return true;
    }
  }
  
  /**
   * 获取有效的访问令牌
   * 如果当前令牌即将过期，会自动尝试刷新
   */
  static async getValidAccessToken(): Promise<string | null> {
    const currentToken = localStorage.getItem('accessToken');
    
    if (!currentToken) {
      console.log('没有访问令牌');
      return null;
    }
    
    // 如果令牌已过期，尝试刷新
    if (this.isTokenExpired(currentToken)) {
      console.log('访问令牌已过期，尝试刷新');
      const refreshed = await this.refreshAccessToken();
      if (refreshed) {
        return localStorage.getItem('accessToken');
      } else {
        return null;
      }
    }
    
    // 如果令牌即将过期，在后台刷新
    if (this.isTokenExpiringSoon(currentToken)) {
      console.log('访问令牌即将过期，后台刷新');
      // 不等待刷新完成，先返回当前令牌
      this.refreshAccessTokenInBackground();
    }
    
    return currentToken;
  }
  
  /**
   * 后台刷新令牌
   */
  private static refreshAccessTokenInBackground(): void {
    // 避免重复刷新
    if (this.refreshPromise) {
      return;
    }
    
    this.refreshPromise = this.refreshAccessToken()
      .finally(() => {
        this.refreshPromise = null;
      });
  }
  
  /**
   * 刷新访问令牌
   */
  static async refreshAccessToken(): Promise<boolean> {
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (!refreshToken) {
      console.log('没有刷新令牌');
      return false;
    }
    
    // 如果刷新令牌格式无效（例如模拟令牌），不要请求后端
    if (!this.isValidTokenFormat(refreshToken)) {
      console.warn('刷新令牌格式无效，跳过刷新并清除本地令牌');
      this.clearAllTokens();
      return false;
    }
    
    try {
      const apiBaseUrl = (import.meta as any).env?.VITE_API_BASE_URL || (process as any)?.env?.REACT_APP_API_BASE_URL || 'http://localhost:3001/api';
      
      console.log('发送刷新令牌请求到:', `${apiBaseUrl}/auth/refresh-token`);
      
      const response = await fetch(`${apiBaseUrl}/auth/refresh-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ refreshToken })
      });
      
      const data = await response.json();
      console.log('刷新令牌响应:', data);
      
      if (data.code === 200 && data.data?.accessToken) {
        localStorage.setItem('accessToken', data.data.accessToken);
        console.log('访问令牌刷新成功');
        return true;
      } else {
        console.error('刷新令牌失败:', data.message);
        
        // 如果刷新失败，清除所有令牌
        if (data.code === 403) {
          this.clearAllTokens();
        }
        
        return false;
      }
    } catch (error) {
      console.error('刷新令牌请求失败:', error);
      return false;
    }
  }
  
  /**
   * 清除所有令牌和用户信息
   */
  static clearAllTokens(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('isAuthenticated');
    console.log('已清除所有认证信息');
  }
  
  /**
   * 设置令牌
   */
  static setTokens(accessToken: string, refreshToken?: string): void {
    localStorage.setItem('accessToken', accessToken);
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    }
  }
  
  /**
   * 检查令牌格式是否有效
   */
  static isValidTokenFormat(token: string): boolean {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return false;
      }
      
      // 尝试解析头部和载荷
      JSON.parse(atob(parts[0]));
      JSON.parse(atob(parts[1]));
      
      return true;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * 获取令牌载荷信息
   */
  static getTokenPayload(token: string): any {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }
      
      return JSON.parse(atob(parts[1]));
    } catch (error) {
      console.error('解析令牌载荷时出错:', error);
      return null;
    }
  }
}

// 添加默认导出以支持不同的导入方式
export default TokenManager;