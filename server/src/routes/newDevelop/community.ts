import { Router } from "express";
import { NewDevelopCommunityController } from "../../controllers/newDevelop/community.controller";

const router = Router();

// 发布动态
router.post("/community/post", NewDevelopCommunityController.createPost);
// 列表
router.get("/community/post", NewDevelopCommunityController.listPosts);

// 点赞与取消点赞
router.post("/community/post/:id/like", NewDevelopCommunityController.likePost);
router.post("/community/post/:id/unlike", NewDevelopCommunityController.unlikePost);

// 评论
router.post("/community/post/:id/comment", NewDevelopCommunityController.addComment);

export default router;


