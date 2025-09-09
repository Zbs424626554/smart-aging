import { Router } from 'express';
import mongoose from 'mongoose';
import type { Server as IOServer } from 'socket.io';
import { authenticateToken } from '../middleware/auth.middleware';
import { initiateEmergency, cancelEmergency, uploadAudioBase64, commitEmergency } from '../controllers/emergency.controller';
import { EmergencyAlert } from '../models/emergency.model';
import { clear } from 'console';

export default function emergencyRoutes(io: IOServer) {
  const router = Router();
  router.post('/initiate', authenticateToken, initiateEmergency(io));
  router.post('/:id/cancel', authenticateToken, cancelEmergency(io));
  router.post('/:id/upload-audio-base64', authenticateToken, uploadAudioBase64(io));
  router.post('/:id/commit', authenticateToken, commitEmergency(io));
  // 老人端：获取当前老人的紧急联系人对应的家属用户名列表（用于应用内通话）
  router.get('/receivers', authenticateToken, async (req, res) => {
    try {
      // 来源优先级：alertId -> query.elderlyId -> token.userId
      let elderlyId = (req as any).userId as string;
      const qAlertId = String((req.query as any)?.alertId || '') || '';
      const qElderlyId = String((req.query as any)?.elderlyId || '') || '';
      const { ElderHealthArchive } = await import('../models/elderhealth.model');
      const { User } = await import('../models/user.model');
      const { EmergencyAlert } = await import('../models/emergency.model');
      if (qAlertId) {
        const found = await EmergencyAlert.findById(qAlertId).select('userId').lean();
        if (found?.userId) elderlyId = String(found.userId);
      } else if (qElderlyId) {
        elderlyId = qElderlyId;
      }
      // 强制按 ObjectId 查询，避免字符串匹配误差
      const oid = (() => {
        try { return new mongoose.Types.ObjectId(elderlyId); } catch { return null; }
      })();
      const userDoc: any = await User.findById(elderlyId).select('username realname phone _id').lean();
      const archive: any = oid
        ? await ElderHealthArchive.findOne({ elderID: oid }).lean()
        : await ElderHealthArchive.findOne({ elderID: elderlyId as any }).lean();
      const out: string[] = [];
      if (archive?.emcontact) {
        const { username, phone, realname } = archive.emcontact || {} as any;
        if (username) out.push(username);
        if (phone) {
          const u = await User.findOne({ phone }).select('username').lean();
          if (u?.username) out.push(u.username);
        }
        // 新增：按 realname 兜底查找用户（忽略大小写）
        if (realname && !username) {
          const u2 = await User.findOne({ realname: { $regex: new RegExp(`^${realname}$`, 'i') } })
            .select('username')
            .lean();
          if (u2?.username) out.push(u2.username);
        }
      }
      // 二级兜底：若档案无 emcontact，则尝试从最近一条告警的 contactPhone/contactName 反查
      if (out.length === 0) {
        const last = await EmergencyAlert.findOne({ userId: elderlyId })
          .sort({ createdAt: -1 })
          .select('contactPhone contactName')
          .lean();
        if (last?.contactPhone) {
          const u = await User.findOne({ phone: last.contactPhone }).select('username').lean();
          if (u?.username) out.push(u.username);
        }
        if (last?.contactName && out.length === 0) {
          const u2 = await User.findOne({ realname: { $regex: new RegExp(`^${last.contactName}$`, 'i') } })
            .select('username')
            .lean();
          if (u2?.username) out.push(u2.username);
        }
      }
      // 调试输出
      console.log('[Emergency][receivers] src=', qAlertId ? 'alertId' : (qElderlyId ? 'query' : 'token'), 'elderlyId=', elderlyId, 'user=', userDoc, 'archiveQueryByOid=', !!oid, 'archive?.elderID=', archive?.elderID, 'archive?.emcontact=', archive?.emcontact, 'out=', out);
      return res.json({ code: 200, message: 'ok', data: Array.from(new Set(out)) });
    } catch (e) {
      console.error('[Emergency][receivers] error:', e);
      return res.json({ code: 500, message: 'server error', data: [] });
    }
  });
  // 家属端：获取我能看到的紧急告警（按时间倒序）
  router.get('/family', authenticateToken, async (req, res) => {
    try {
      const userId = (req as any).userId as string;
      const { User } = await import('../models/user.model');
      const { ElderHealthArchive } = await import('../models/elderhealth.model');

      // 当前家属信息
      const me: any = await User.findById(userId).select('username realname phone').lean();

      // A) 通过紧急联系人信息（档案）反查老人ID
      const archiveOr: any[] = [];
      if (me?.username) archiveOr.push({ 'emcontact.username': me.username });
      if (me?.realname) archiveOr.push({ 'emcontact.realname': me.realname });
      if (me?.phone) archiveOr.push({ 'emcontact.phone': me.phone });
      let elderIds: any[] = [];
      if (archiveOr.length) {
        const archives = await ElderHealthArchive.find({ $or: archiveOr }).select('elderID').lean();
        elderIds = archives.map((a: any) => a.elderID).filter(Boolean);
      }

      // B) 在事件上直接匹配联系人字段（名字用模糊、忽略大小写；电话用精确）
      const ors: any[] = [];
      if (elderIds.length) ors.push({ userId: { $in: elderIds } });
      const nameRegex: any[] = [];
      if (me?.username) nameRegex.push({ contactName: { $regex: me.username, $options: 'i' } });
      if (me?.realname) nameRegex.push({ contactName: { $regex: me.realname, $options: 'i' } });
      if (nameRegex.length) ors.push({ $or: nameRegex });
      if (me?.phone) ors.push({ contactPhone: me.phone });
      // 兼容历史把家属名字误写到 elderlyName 的情况
      const elderNameRegex: any[] = [];
      if (me?.username) elderNameRegex.push({ elderlyName: { $regex: me.username, $options: 'i' } });
      if (me?.realname) elderNameRegex.push({ elderlyName: { $regex: me.realname, $options: 'i' } });
      if (elderNameRegex.length) ors.push({ $or: elderNameRegex });

      if (!ors.length) return res.json({ code: 200, message: 'ok', data: [] });

      const list = await EmergencyAlert.find({ $or: ors })
        .sort({ createdAt: -1 })
        .limit(200)
        .select('userId status triggerTime createdAt location aiAnalysis transcript elderlyName contactName contactPhone')
        .lean();

      // 兜底：elderlyName 以老人用户的昵称/实名为准
      const ids = Array.from(new Set(list.map((d: any) => String(d.userId))));
      const users = await User.find({ _id: { $in: ids } }).select('username realname').lean();
      const id2name = new Map<string, string>();
      users.forEach((u: any) => id2name.set(String(u._id), u.username || u.realname || ''));
      const shaped = list.map((d: any) => ({
        ...d,
        elderlyName: d.elderlyName || id2name.get(String(d.userId)) || '老人'
      }));

      return res.json({ code: 200, message: 'ok', data: shaped });
    } catch (e) {
      console.error('[Emergency] Family query error:', e);
      return res.json({ code: 500, message: 'server error', data: null });
    }
  });
  // 告警详情（包含音频）
  router.get('/:id', authenticateToken, async (req, res) => {
    try {
      const doc = await EmergencyAlert.findById(req.params.id).lean();
      if (!doc) return res.json({ code: 404, message: 'not found', data: null });
      return res.json({ code: 200, message: 'ok', data: doc });
    } catch (e) {
      return res.json({ code: 500, message: 'server error', data: null });
    }
  });
  return router;
}
