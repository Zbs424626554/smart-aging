import { Router } from "express";
import { NewDevelopElderHealthController } from "../../controllers/newDevelop/elderhealth.controller";

const router = Router();

// 删除用药时间设置
router.post(
  "/elderhealth/medication/delete",
  NewDevelopElderHealthController.deleteMedicationTime
);

export default router;
