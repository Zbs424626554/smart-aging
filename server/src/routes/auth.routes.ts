import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/create-elderly', AuthController.createElderly); // 添加创建老人路由
router.get('/profile', authenticateToken, AuthController.getProfile); // 添加认证中间件

export default router;
