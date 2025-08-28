import { Router } from "express";
import { authenticateToken } from "../../middleware/auth.middleware";
import ElderOrderController from "../../controllers/zbs/order.controller";

const router = Router();

// 获取当前登录老人（elderlyId 即为登录用户 _id）的订单
router.get("/my", authenticateToken, ElderOrderController.getMyOrders);

export default router;
