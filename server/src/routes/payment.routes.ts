import express from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import QRCode from 'qrcode';

const router = express.Router();

// 创建支付订单
router.post('/create', authenticateToken, async (req, res) => {
  try {
    const { orderId, orderNo, amount, subject, body } = req.body;

    // 使用模拟模式
    console.log('使用模拟支付模式');

    // 生成模拟的支付宝沙箱支付链接
    const alipayParams = {
      app_id: '2021000122123456', // 模拟AppID
      method: 'alipay.trade.precreate',
      format: 'JSON',
      charset: 'utf-8',
      sign_type: 'RSA2',
      timestamp: new Date().toISOString(),
      version: '1.0',
      notify_url: 'https://your-domain.com/api/payment/notify',
      biz_content: JSON.stringify({
        out_trade_no: orderId,
        total_amount: amount.toFixed(2),
        subject: subject || '护理服务',
        qr_code_timeout_express: '5m'
      })
    };

    const paymentUrl = `https://openapi.alipaydev.com/gateway.do?${new URLSearchParams(alipayParams).toString()}`;

    const qrCodeDataUrl = await QRCode.toDataURL(paymentUrl, {
      width: 200,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    res.json({
      code: 200,
      message: 'ok',
      data: {
        success: true,
        paymentUrl,
        qrCode: qrCodeDataUrl,
        tradeNo: `MOCK_ALIPAY${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        orderId
      }
    });
  } catch (error) {
    console.error('创建支付订单失败:', error);
    res.status(500).json({ code: 500, message: '创建支付订单失败', data: null });
  }
});

// 长轮询查询支付状态
router.get('/status/:orderId', authenticateToken, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { timeout = 30000 } = req.query; // 默认30秒超时

    // 设置响应头，支持长轮询
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Content-Type', 'application/json');

    // 模拟支付状态检查逻辑
    const checkPaymentStatus = async (): Promise<{ status: string; tradeNo?: string; paidAt?: string; amount?: number }> => {
      // 这里应该查询数据库或调用支付宝API
      // 目前使用模拟逻辑

      // 模拟：有10%的概率支付成功（用于测试）
      if (Math.random() < 0.1) {
        return {
          status: 'paid',
          tradeNo: `ALIPAY${Date.now()}`,
          paidAt: new Date().toISOString(),
          amount: 160
        };
      }

      return { status: 'pending' };
    };

    // 立即检查一次状态
    const status = await checkPaymentStatus();

    if (status.status !== 'pending') {
      // 如果状态已改变，立即返回
      return res.json({
        code: 200,
        message: 'ok',
        data: {
          orderId,
          ...status
        }
      });
    }

    // 如果状态还是pending，开始长轮询
    const startTime = Date.now();
    const maxWaitTime = parseInt(timeout as string) || 30000;

    const pollInterval = setInterval(async () => {
      try {
        const currentStatus = await checkPaymentStatus();

        if (currentStatus.status !== 'pending') {
          clearInterval(pollInterval);
          return res.json({
            code: 200,
            message: 'ok',
            data: {
              orderId,
              ...currentStatus
            }
          });
        }

        // 检查是否超时
        if (Date.now() - startTime > maxWaitTime) {
          clearInterval(pollInterval);
          return res.json({
            code: 200,
            message: 'timeout',
            data: {
              orderId,
              status: 'pending'
            }
          });
        }
      } catch (error) {
        clearInterval(pollInterval);
        console.error('长轮询检查失败:', error);
        return res.status(500).json({
          code: 500,
          message: '查询支付状态失败',
          data: { orderId, status: 'failed' }
        });
      }
    }, 2000); // 每2秒检查一次

    // 客户端断开连接时清理
    req.on('close', () => {
      clearInterval(pollInterval);
    });

  } catch (error) {
    console.error('查询支付状态失败:', error);
    res.status(500).json({
      code: 500,
      message: '查询支付状态失败',
      data: { orderId: req.params.orderId, status: 'failed' }
    });
  }
});

// 申请退款
router.post('/refund', authenticateToken, async (req, res) => {
  try {
    const { orderId, orderNo, amount, reason } = req.body;

    // 模拟退款处理
    const isSuccess = Math.random() > 0.05; // 95%成功率

    if (isSuccess) {
      res.json({ code: 200, message: 'ok', data: { success: true, refundNo: `REFUND${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}` } });
    } else {
      res.json({ code: 200, message: 'ok', data: { success: false, message: '退款申请失败，请联系客服' } });
    }
  } catch (error) {
    console.error('申请退款失败:', error);
    res.status(500).json({ code: 500, message: '申请退款失败', data: null });
  }
});

// 查询退款状态
router.get('/refund/status/:refundNo', authenticateToken, async (req, res) => {
  try {
    const { refundNo } = req.params;

    // 模拟查询退款状态
    const isSuccess = Math.random() > 0.1; // 90%成功率

    if (isSuccess) {
      res.json({ code: 200, message: 'ok', data: { success: true, refundNo, status: 'completed' } });
    } else {
      res.json({ code: 200, message: 'ok', data: { success: false, message: '查询退款状态失败' } });
    }
  } catch (error) {
    console.error('查询退款状态失败:', error);
    res.status(500).json({ code: 500, message: '查询退款状态失败', data: null });
  }
});

// 获取支付配置状态
router.get('/config/status', authenticateToken, async (req, res) => {
  try {
    res.json({
      code: 200,
      message: 'ok',
      data: {
        appId: false,
        privateKey: false,
        publicKey: false,
        isConfigured: false,
        mode: 'mock'
      }
    });
  } catch (error) {
    console.error('获取配置状态失败:', error);
    res.status(500).json({ code: 500, message: '获取配置状态失败', data: null });
  }
});

export default router;
