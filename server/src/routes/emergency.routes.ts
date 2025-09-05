import { Router } from 'express';
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
  // 家属端：获取我能看到的紧急告警（按时间倒序）
  router.get('/family', authenticateToken, async (req, res) => {
    try {
      // const list = await EmergencyAlert.find()

      const userId = (req as any).userId as string;
      const me = await (await import('../models/user.model')).User.findById(userId).select('username phone').lean();

      // // 直接在紧急求助表中根据联系人信息筛选
      const query: any = [];
      if (me?.username) query.push({ elderlyName: me.username });
      // if (me?.phone) query.push({ contactPhone: me.phone });
      console.log(query, 2);
      const list = await EmergencyAlert.find(query.length ? { $or: query } : { _id: null })
        .sort({ createdAt: -1 })
        .limit(100)
        .select('userId status triggerTime createdAt location aiAnalysis transcript elderlyName contactName contactPhone')
        .lean();
      // console.log(list, 2);
      return res.json({ code: 200, message: 'ok', data: list });
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
