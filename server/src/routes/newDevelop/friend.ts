import { Router } from "express";
import { NewDevelopFriendController } from "../../controllers/newDevelop/friend.controller";

const router = Router();

// 创建好友申请
router.post("/friend/request", NewDevelopFriendController.createRequest);

// 获取接收者的好友申请列表
router.get("/friend/requests", NewDevelopFriendController.getReceivedRequests);

// 更新好友申请状态
router.patch("/friend/request/:id/status", NewDevelopFriendController.updateRequestStatus);

export default router;


