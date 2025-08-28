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

export default router;
