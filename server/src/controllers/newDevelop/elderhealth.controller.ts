import { Request, Response } from "express";
import { ElderHealthArchive } from "../../models/elderhealth.model";
import { verifyToken } from "../../utils/jwt";

export class NewDevelopElderHealthController {
  // 删除用药时间设置，并返回更新后的档案
  static async deleteMedicationTime(req: Request, res: Response) {
    try {
      const auth = req.headers.authorization;
      let userId: string | null = null;

      if (auth && auth.startsWith("Bearer ")) {
        const token = auth.slice(7);
        try {
          const payload = verifyToken(token) as any;
          userId = payload?.id || null;
        } catch {
          // ignore token errors
        }
      }

      const elderIdFromQuery = (req.query.elderId as string) || null;
      const elderId = userId || elderIdFromQuery;

      if (!elderId) {
        return res.json({ code: 401, message: "未登录", data: null });
      }

      const { name, time } = req.body || {};
      const medicationName = (name || "").trim();
      const medicationTime = (time || "").trim();

      if (!medicationName) {
        return res.json({ code: 400, message: "参数不完整", data: null });
      }

      const archive = await ElderHealthArchive.findOne({ elderID: elderId });
      if (!archive) {
        return res.json({ code: 404, message: "未找到健康档案", data: null });
      }

      // 归一化
      const nameToTimes = new Map<string, Set<string>>();
      for (const item of (archive.useMedication as any[]) || []) {
        const nm = (item?.name || "").trim();
        if (!nm) continue;
        const set = nameToTimes.get(nm) || new Set<string>();
        if (Array.isArray(item?.times)) for (const t of item.times) if (t) set.add(String(t));
        if (item?.time) set.add(String(item.time));
        nameToTimes.set(nm, set);
      }

      if (!nameToTimes.has(medicationName)) {
        return res.json({ code: 200, message: "已删除", data: archive });
      }

      if (medicationTime) {
        const set = nameToTimes.get(medicationName)!;
        set.delete(medicationTime);
        if (set.size === 0) nameToTimes.delete(medicationName);
      } else {
        nameToTimes.delete(medicationName);
      }

      const normalized: any[] = [];
      for (const [nm, set] of nameToTimes.entries()) {
        const arr = Array.from(set).sort();
        normalized.push({ name: nm, times: arr });
      }

      await ElderHealthArchive.updateOne(
        { elderID: elderId },
        { $set: { useMedication: normalized } }
      );

      const updated = await ElderHealthArchive.findOne({ elderID: elderId });
      return res.json({ code: 200, message: "删除成功", data: updated });
    } catch (error) {
      console.error("[newDevelop] 删除用药时间设置失败:", error);
      return res
        .status(500)
        .json({ code: 500, message: "服务器错误", data: null });
    }
  }

  // 更新身高（厘米）
  static async updateHeight(req: Request, res: Response) {
    try {
      const auth = req.headers.authorization;
      let userId: string | null = null;

      if (auth && auth.startsWith("Bearer ")) {
        const token = auth.slice(7);
        try {
          const payload = verifyToken(token) as any;
          userId = payload?.id || null;
        } catch {
          // ignore token errors
        }
      }

      const elderIdFromQuery = (req.query.elderId as string) || null;
      const elderId = userId || elderIdFromQuery;

      if (!elderId) {
        return res.json({ code: 401, message: "未登录", data: null });
      }

      const raw = req.body?.heightCm;
      const heightCm = Number(raw);
      if (!Number.isFinite(heightCm) || heightCm <= 0 || heightCm > 300) {
        return res.json({ code: 400, message: "身高参数不合法", data: null });
      }

      await ElderHealthArchive.updateOne(
        { elderID: elderId },
        { $setOnInsert: { elderID: elderId }, $set: { heightCm } },
        { upsert: true }
      );

      const updated = await ElderHealthArchive.findOne({ elderID: elderId });
      return res.json({ code: 200, message: "保存成功", data: updated });
    } catch (error) {
      console.error("[newDevelop] 更新身高失败:", error);
      return res
        .status(500)
        .json({ code: 500, message: "服务器错误", data: null });
    }
  }

  // 更新体重（千克）
  static async updateWeight(req: Request, res: Response) {
    try {
      const auth = req.headers.authorization;
      let userId: string | null = null;

      if (auth && auth.startsWith("Bearer ")) {
        const token = auth.slice(7);
        try {
          const payload = verifyToken(token) as any;
          userId = payload?.id || null;
        } catch {
          // ignore token errors
        }
      }

      const elderIdFromQuery = (req.query.elderId as string) || null;
      const elderId = userId || elderIdFromQuery;

      if (!elderId) {
        return res.json({ code: 401, message: "未登录", data: null });
      }

      const raw = req.body?.weightKg;
      const weightKg = Number(raw);
      if (!Number.isFinite(weightKg) || weightKg <= 0 || weightKg > 500) {
        return res.json({ code: 400, message: "体重参数不合法", data: null });
      }

      await ElderHealthArchive.updateOne(
        { elderID: elderId },
        { $setOnInsert: { elderID: elderId }, $set: { weightKg } },
        { upsert: true }
      );

      const updated = await ElderHealthArchive.findOne({ elderID: elderId });
      return res.json({ code: 200, message: "保存成功", data: updated });
    } catch (error) {
      console.error("[newDevelop] 更新体重失败:", error);
      return res
        .status(500)
        .json({ code: 500, message: "服务器错误", data: null });
    }
  }
}

export default NewDevelopElderHealthController;
