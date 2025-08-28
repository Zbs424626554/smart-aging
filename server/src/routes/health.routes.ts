import { Router } from 'express';
import { HealthController } from '../controllers/health.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// 获取老人的健康数据
router.get('/:elderlyId/latest', authenticateToken, HealthController.getLatestHealthData);

// 获取老人的健康历史记录
router.get('/:elderlyId/history', authenticateToken, HealthController.getHealthHistory);

// 创建健康记录
router.post('/', authenticateToken, HealthController.createHealthRecord);

// 更新健康记录
router.put('/:id', authenticateToken, HealthController.updateHealthRecord);

// 获取健康统计
router.get('/:elderlyId/stats', authenticateToken, HealthController.getHealthStats);

// 获取健康警告
router.get('/:elderlyId/warnings', authenticateToken, HealthController.getHealthWarnings);

export default router;
