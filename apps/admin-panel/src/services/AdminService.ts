import { ApiService } from './ApiService';

export class AdminService {
  private static apiService = ApiService.getInstance();

  // 用户管理
  static async getUserList(params?: any) {
    try {
      console.log('获取用户列表');
      const response = await this.apiService.get('/admin/user/list', params);
      console.log('用户列表响应:', response);
      return response;
    } catch (error) {
      const err: any = error as any;
      const errMsg = err?.response?.data?.message || err?.message || '获取用户列表失败';
      console.error('获取用户列表失败:', errMsg);
      throw new Error(errMsg);
    }
  }



  static async addUser(userData: any) {
    try {
      console.log('添加用户:', userData);
      const response = await this.apiService.post('/admin/user/add', userData);
      console.log('添加用户响应:', response);
      return response;
    } catch (error) {
      const err: any = error as any;
      const errMsg = err?.response?.data?.message || err?.message || '添加用户失败';
      console.error('添加用户失败:', errMsg);
      throw new Error(errMsg);
    }
  }

  static async auditUser(userId: string, auditData: any) {
    try {
      console.log('审核用户:', userId, auditData);
      const response = await this.apiService.post(`/admin/user/audit`, {
        userId,
        ...auditData
      });
      console.log('审核用户响应:', response);
      return response;
    } catch (error) {
      const err: any = error as any;
      const errMsg = err?.response?.data?.message || err?.message || '审核用户失败';
      console.error('审核用户失败:', errMsg);
      throw new Error(errMsg);
    }
  }

  static async updateUserStatus(userId: string, status: string, reason?: string) {
    try {
      console.log('更新用户状态:', userId, status, reason);
      const response = await this.apiService.post('/admin/user/status', {
        userId,
        status,
        reason
      });
      console.log('更新用户状态响应:', response);
      return response;
    } catch (error) {
      const err: any = error as any;
      const errMsg = err?.response?.data?.message || err?.message || '更新用户状态失败';
      console.error('更新用户状态失败:', errMsg);
      throw new Error(errMsg);
    }
  }

  static async assignUserRole(userId: string, adminRole: string, pagePermissions?: string[]) {
    try {
      console.log('分配用户角色:', userId, adminRole);
      const response = await this.apiService.post('/admin/user/role', {
        userId,
        adminRole,
        // 可选：同时更新页面权限
        ...(pagePermissions ? { pagePermissions } : {})
      });
      console.log('分配角色响应:', response);
      return response;
    } catch (error) {
      const err: any = error as any;
      const errMsg = err?.response?.data?.message || err?.message || '分配角色失败';
      console.error('分配角色失败:', errMsg);
      throw new Error(errMsg);
    }
  }

  static async deleteUsers(userIds: string[]) {
    try {
      console.log('批量删除用户:', userIds);
      const response = await this.apiService.post('/admin/user/delete', { userIds });
      console.log('批量删除用户响应:', response);
      return response;
    } catch (error) {
      const err: any = error as any;
      const errMsg = err?.response?.data?.message || err?.message || '批量删除用户失败';
      console.error('批量删除用户失败:', errMsg);
      throw new Error(errMsg);
    }
  }

  // 管理统计（用于用户管理页的头部统计）
  static async getAdminStatistics() {
    try {
      return await this.apiService.get('/admin/statistics');
    } catch (error) {
      const err: any = error as any;
      const errMsg = err?.response?.data?.message || err?.message || '获取统计数据失败';
      console.error('获取统计数据失败:', errMsg);
      throw new Error(errMsg);
    }
  }

  // 订单管理
  static async getOrderList(params?: any) {
    try {
      return await this.apiService.get('/admin/order/list', params);
    } catch (error) {
      console.error('获取订单列表失败:', error);
      throw error;
    }
  }

  static async exportOrders(params?: any) {
    try {
      return await this.apiService.get('/admin/order/export', params);
    } catch (error) {
      console.error('导出订单失败:', error);
      throw error;
    }
  }

  // 服务管理
  static async getServiceList(params?: any) {
    try {
      return await this.apiService.get('/admin/service/list', params);
    } catch (error) {
      console.error('获取服务列表失败:', error);
      throw error;
    }
  }

  static async updateService(serviceId: string, serviceData: any) {
    try {
      return await this.apiService.put(`/admin/service/${serviceId}`, serviceData);
    } catch (error) {
      console.error('更新服务失败:', error);
      throw error;
    }
  }

  // 评价管理
  static async getReviews(params?: any) {
    try {
      return await this.apiService.get('/admin/review/list', params);
    } catch (error) {
      console.error('获取评价列表失败:', error);
      throw error;
    }
  }

  static async getReviewById(reviewId: string) {
    try {
      return await this.apiService.get(`/admin/review/${reviewId}`);
    } catch (error) {
      console.error('获取评价详情失败:', error);
      throw error;
    }
  }

  static async handleReviewAppeal(reviewId: string, action: string, reason?: string) {
    try {
      return await this.apiService.post('/admin/review/appeal', {
        reviewId,
        action,
        reason
      });
    } catch (error) {
      console.error('处理评价申诉失败:', error);
      throw error;
    }
  }

  // 投诉管理
  static async getComplaints(params?: any) {
    try {
      return await this.apiService.get('/admin/complaint/list', params);
    } catch (error) {
      console.error('获取投诉列表失败:', error);
      throw error;
    }
  }

  static async getComplaintById(complaintId: string) {
    try {
      return await this.apiService.get(`/admin/complaint/${complaintId}`);
    } catch (error) {
      console.error('获取投诉详情失败:', error);
      throw error;
    }
  }

  static async handleComplaint(complaintId: string, action: string, response?: string) {
    try {
      return await this.apiService.post('/admin/complaint/handle', {
        complaintId,
        action,
        response
      });
    } catch (error) {
      console.error('处理投诉失败:', error);
      throw error;
    }
  }

  // 数据统计
  static async getReviewList(params?: any) {
    try {
      return await this.apiService.get('/admin/data/reviews', params);
    } catch (error) {
      console.error('获取评价数据失败:', error);
      throw error;
    }
  }

  static async getSupportList(params?: any) {
    try {
      return await this.apiService.get('/admin/data/support', params);
    } catch (error) {
      console.error('获取客服数据失败:', error);
      throw error;
    }
  }

  static async getStatistics(params?: any) {
    try {
      return await this.apiService.get('/admin/data/statistics', params);
    } catch (error) {
      console.error('获取统计数据失败:', error);
      throw error;
    }
  }

  static async exportStatistics(params?: any) {
    try {
      return await this.apiService.get('/admin/data/export', params);
    } catch (error) {
      console.error('导出统计数据失败:', error);
      throw error;
    }
  }

  // 内容管理
  static async getAnnouncements(params?: any) {
    try {
      return await this.apiService.get('/admin/announcement/list', params);
    } catch (error) {
      console.error('获取公告列表失败:', error);
      throw error;
    }
  }

  static async createAnnouncement(data: any) {
    try {
      return await this.apiService.post('/admin/announcement/create', data);
    } catch (error) {
      console.error('创建公告失败:', error);
      throw error;
    }
  }

  static async updateAnnouncement(id: string, data: any) {
    try {
      return await this.apiService.put(`/admin/announcement/${id}`, data);
    } catch (error) {
      console.error('更新公告失败:', error);
      throw error;
    }
  }

  static async deleteAnnouncement(id: string) {
    try {
      return await this.apiService.delete(`/admin/announcement/${id}`);
    } catch (error) {
      console.error('删除公告失败:', error);
      throw error;
    }
  }

  // 基础配置
  static async getConfig(key: string) {
    try {
      return await this.apiService.get(`/admin/config/${key}`);
    } catch (error) {
      console.error('获取配置失败:', error);
      throw error;
    }
  }

  static async updateConfig(key: string, value: any) {
    try {
      return await this.apiService.put(`/admin/config/${key}`, { value });
    } catch (error) {
      console.error('更新配置失败:', error);
      throw error;
    }
  }

  // 支付结算：获取支付交易记录
  static async getPayments(params?: any) {
    try {
      console.log('获取支付交易记录:', params);
      const response = await this.apiService.get('/admin/payments', params);
      console.log('支付交易记录响应:', response);
      return response;
    } catch (error) {
      const err: any = error as any;
      const errMsg = err?.response?.data?.message || err?.message || '获取支付交易记录失败';
      console.error('获取支付交易记录失败:', errMsg);
      throw new Error(errMsg);
    }
  }

  // 支付结算：获取提现申请列表
  static async getWithdrawals(params?: any) {
    try {
      console.log('获取提现申请列表:', params);
      const response = await this.apiService.get('/admin/withdrawals', params);
      console.log('提现申请列表响应:', response);
      return response;
    } catch (error) {
      const err: any = error as any;
      const errMsg = err?.response?.data?.message || err?.message || '获取提现申请列表失败';
      console.error('获取提现申请列表失败:', errMsg);
      throw new Error(errMsg);
    }
  }
}