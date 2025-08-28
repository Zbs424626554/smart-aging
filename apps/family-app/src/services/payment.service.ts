import { http } from '../utils/request';

export interface PaymentRequest {
  orderId: string;
  orderNo: string;
  amount: number;
  subject: string;
  body?: string;
}

export interface PaymentResponse {
  success: boolean;
  paymentUrl?: string;
  qrCode?: string;
  tradeNo?: string;
  message?: string;
}

export interface RefundRequest {
  orderId: string;
  orderNo: string;
  amount: number;
  reason: string;
}

export interface RefundResponse {
  success: boolean;
  refundNo?: string;
  message?: string;
}

export interface PaymentStatus {
  orderId: string;
  status: 'pending' | 'paid' | 'failed' | 'cancelled';
  tradeNo?: string;
  paidAt?: string;
  amount?: number;
}

export class PaymentService {
  // 创建支付订单
  static async createPayment(data: PaymentRequest): Promise<PaymentResponse> {
    try {
      const response = await http.post('/payment/create', data);
      return response.data;
    } catch (error) {
      console.error('创建支付订单失败:', error);
      return {
        success: false,
        message: '创建支付订单失败'
      };
    }
  }

  // 查询支付状态（支持长轮询）
  static async queryPaymentStatus(orderId: string, timeout?: number): Promise<PaymentStatus> {
    try {
      const params = timeout ? { timeout } : {};
      // 为长轮询设置更长的超时时间
      const config = timeout ? {
        params,
        timeout: Math.max(timeout + 5000, 35000) // 比后端超时多5秒，最少35秒
      } : {};
      const response = await http.get(`/payment/status/${orderId}`, config);
      return response.data;
    } catch (error) {
      console.error('查询支付状态失败:', error);
      return {
        orderId,
        status: 'failed'
      };
    }
  }

  // 申请退款
  static async requestRefund(data: RefundRequest): Promise<RefundResponse> {
    try {
      const response = await http.post('/payment/refund', data);
      return response.data;
    } catch (error) {
      console.error('申请退款失败:', error);
      return {
        success: false,
        message: '申请退款失败'
      };
    }
  }

  // 查询退款状态
  static async queryRefundStatus(refundNo: string): Promise<RefundResponse> {
    try {
      const response = await http.get(`/payment/refund/status/${refundNo}`);
      return response.data;
    } catch (error) {
      console.error('查询退款状态失败:', error);
      return {
        success: false,
        message: '查询退款状态失败'
      };
    }
  }

  // 支付宝沙箱支付（调用后端API）
  static async mockAlipayPayment(orderId: string, amount: number): Promise<PaymentResponse> {
    try {
      const response = await this.createPayment({
        orderId,
        orderNo: `PAY${Date.now()}`,
        amount,
        subject: '护理服务'
      });
      return response;
    } catch (error) {
      console.error('支付失败:', error);
      return {
        success: false,
        message: '支付失败，请重试'
      };
    }
  }

  // 退款处理（调用后端API）
  static async mockRefund(orderId: string, amount: number): Promise<RefundResponse> {
    try {
      const response = await this.requestRefund({
        orderId,
        orderNo: `REFUND${Date.now()}`,
        amount,
        reason: '用户申请退款'
      });
      return response;
    } catch (error) {
      console.error('退款失败:', error);
      return {
        success: false,
        message: '退款申请失败，请联系客服'
      };
    }
  }
}
