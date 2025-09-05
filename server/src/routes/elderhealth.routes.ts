import { Router } from 'express';
import { ElderHealthController } from '../controllers/elderhealth.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// 获取老人的健康档案
router.get('/:elderlyId', authenticateToken, ElderHealthController.getElderHealthArchive);

// 获取所有老人的健康档案
router.get('/', authenticateToken, ElderHealthController.getAllElderHealthArchives);

// 创建或更新老人健康档案
router.post('/', authenticateToken, ElderHealthController.createOrUpdateElderHealthArchive);

// 仅更新生命体征的便捷路由（前端更新体征更直观）
router.post('/:elderID/vitals', authenticateToken, ElderHealthController.createOrUpdateElderHealthArchive);

// 护士端更新生命体征的路由（不需要认证，通过elderlyId参数指定）
router.post('/vitals', ElderHealthController.updateVitals);

// 初始化健康档案的路由（不需要认证，通过elderlyId参数指定）
router.post('/init', ElderHealthController.initElderHealthArchive);

export default router;
