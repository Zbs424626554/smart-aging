import express from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = express.Router();

// 用户管理相关路由
router.get('/elderly', authenticateToken, UserController.getElderlyList);
router.get('/role/elderly/all', authenticateToken, UserController.getAllElderlyUsers);
router.get('/elderly/:id', authenticateToken, UserController.getElderlyDetail);
router.post('/bind-elderly', authenticateToken, UserController.bindElderly);
router.delete('/unbind-elderly/:id', authenticateToken, UserController.unbindElderly);
router.get('/test-all', authenticateToken, UserController.testGetAllUsers);
router.post('/adduser',authenticateToken,UserController.addUser)

export default router;
