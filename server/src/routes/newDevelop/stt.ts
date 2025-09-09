import { Router } from "express";
import { NewDevelopSttController } from "../../controllers/newDevelop/stt.controller";

const router = Router();

// 语音转文字（后端转写）
router.post("/stt/transcribe", NewDevelopSttController.transcribe);

export default router;


