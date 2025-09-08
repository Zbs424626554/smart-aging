import { Router } from "express";
import { NewDevelopElderHealthController } from "../../controllers/newDevelop/elderhealth.controller";

const router = Router();

// 删除用药时间设置
router.post(
  "/elderhealth/medication/delete",
  NewDevelopElderHealthController.deleteMedicationTime
);

// 更新身高/体重
router.post(
  "/elderhealth/height",
  NewDevelopElderHealthController.updateHeight
);
router.post(
  "/elderhealth/weight",
  NewDevelopElderHealthController.updateWeight
);

export default router;
