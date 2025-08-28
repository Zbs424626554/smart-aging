import { Request, Response } from 'express';
import type { Server as IOServer } from 'socket.io';
import { EmergencyAlert } from '../models/emergency.model';
import { ElderHealthArchive } from '../models/elderhealth.model';
import { User } from '../models/user.model';
import { analyzeEmergency } from '../ai/analyze';
import { transcribeBase64Audio } from '../ai/transcribe';
import { placeEmergencyCall } from '../services/voiceCall.service';

async function resolveEmergencyReceivers(elderlyUserId: string): Promise<string[]> {
  try {
    const archive = await ElderHealthArchive.findOne({ elderID: elderlyUserId });
    const receivers: string[] = [];

    if (archive?.emcontact) {
      const { username, phone } = archive.emcontact as any;

      let contactUser = null as any;
      if (username) {
        contactUser = await User.findOne({ username }).select('_id');
      }
      if (!contactUser && phone) {
        contactUser = await User.findOne({ phone }).select('_id');
      }
      if (contactUser?._id) {
        receivers.push(String(contactUser._id));
      }
    }

    return receivers;
  } catch (e) {
    return [];
  }
}

async function getEmergencyContactPhone(elderlyUserId: string): Promise<string | undefined> {
  const archive = await ElderHealthArchive.findOne({ elderID: elderlyUserId });
  // 优先使用紧急联系人电话，如果没有则使用默认电话
  return archive?.emcontact?.phone || archive?.phone || '19253326584';
}

function emitToReceivers(io: IOServer, receivers: string[], event: string, payload: any) {
  if (!receivers.length) {
    // fallback：无人订阅时避免丢消息，仍旧广播（可按需移除）
    io.emit(event, payload);
    return;
  }

  receivers.forEach((uid) => {
    io.to(`user:${uid}`).emit(event, payload);
  });
}

export const initiateEmergency = (io: IOServer) => async (req: Request, res: Response) => {
  // 优先使用请求体中的 userId（老人端传入），这样可以确保使用老人的 ID 而不是当前登录用户的 ID
  const userId = req.body.userId || (req as any).userId;
  if (!userId) return res.json({ code: 401, message: '未登录', data: null });
  // 预取老人/联系人的姓名和电话，便于后续展示和筛选
  let elderlyName: string | undefined = undefined;
  let contactName: string | undefined = undefined;
  let contactPhone: string | undefined = undefined;
  try {
    // 优先从用户表的username获取老人姓名
    const u = await User.findById(userId).select('realname username').lean();
    elderlyName = (u as any)?.username || (u as any)?.realname;

    // 获取紧急联系人姓名和电话
    const archive = await ElderHealthArchive.findOne({ elderID: userId }).lean();
    contactName = (archive as any)?.emcontact?.realname || (archive as any)?.emcontact?.username;
    contactPhone = (archive as any)?.emcontact?.phone || (archive as any)?.phone || '19253326584';
  } catch { }
  const doc = await EmergencyAlert.create({ userId, status: 'pending', elderlyName, contactName, contactPhone });
  // 不在发起阶段推送，避免误触；待提交（倒计时结束）时再推送
  res.json({ code: 200, message: 'ok', data: { alertId: String(doc._id) } });
};

export const cancelEmergency = (io: IOServer) => async (req: Request, res: Response) => {
  const { id } = req.params;
  const doc = await EmergencyAlert.findByIdAndUpdate(id, { status: 'falseAlarm' }, { new: true });
  const elderlyId = doc?.userId ? String(doc.userId) : undefined;
  const receivers = elderlyId ? await resolveEmergencyReceivers(elderlyId) : [];
  const contactPhone = elderlyId ? await getEmergencyContactPhone(elderlyId) : undefined;
  const payload = { alertId: id, status: 'falseAlarm', elderlyId, contactPhone };
  emitToReceivers(io, receivers, 'emergency:updated', payload);
  res.json({ code: 200, message: 'ok', data: { ok: true } });
};

// 采用 base64 文本上传音频，不依赖 multer
export const uploadAudioBase64 = (io: IOServer) => async (req: Request, res: Response) => {
  const { id } = req.params;
  const { base64 } = req.body as { base64?: string };
  if (!base64) return res.json({ code: 400, message: '缺少音频内容', data: null });
  const doc = await EmergencyAlert.findByIdAndUpdate(id, { audioClip: base64 }, { new: true });
  // 录音阶段不推送，避免误触；只存储
  res.json({ code: 200, message: 'ok', data: { stored: true } });
};

export const commitEmergency = (io: IOServer) => async (req: Request, res: Response) => {
  const { id } = req.params;
  const { location, base64 } = req.body as { location?: { type: 'Point'; coordinates: [number, number] }; base64?: string };

  const updateObj: any = { location };
  if (base64) {
    updateObj.audioClip = base64;
  }
  const updated = await EmergencyAlert.findByIdAndUpdate(id, updateObj, { new: true });

  // 一、先行外呼（按需求：5s后未取消即拨号）
  const elderlyId = updated?.userId ? String(updated.userId) : undefined;
  const receivers = elderlyId ? await resolveEmergencyReceivers(elderlyId) : [];
  const contactPhone = elderlyId ? await getEmergencyContactPhone(elderlyId) : undefined;
  // 优先使用已保存的老人姓名，如果没有再查询（优先username）
  let elderlyName: string | undefined = updated?.elderlyName;
  if (!elderlyName && elderlyId) {
    try {
      const { User } = await import('../models/user.model');
      const u = await User.findById(elderlyId).select('realname username').lean();
      elderlyName = (u as any)?.username || (u as any)?.realname;
    } catch { }
  }
  const callingPayload = { alertId: id, status: 'calling', elderlyId, elderlyName, contactPhone, location };
  // 临时：如果没有找到紧急联系人，就广播给所有人（测试用）
  if (receivers.length === 0) {
    io.emit('emergency:updated', callingPayload);
  } else {
    emitToReceivers(io, receivers, 'emergency:updated', callingPayload);
  }
  if (contactPhone) {
    // 不依赖高风险判定，直接拨号（异步）
    placeEmergencyCall(contactPhone, '检测到紧急情况，请尽快联系老人或前往查看。').catch(() => void 0);
  }

  // 立即返回，避免前端等待转写/分析导致超时
  res.json({ code: 200, message: 'ok', data: { queued: true } });

  // 在后台异步执行：转写 + 语义分析 + 事件推送
  setImmediate(async () => {
    let transcript: string | undefined = undefined;
    if (updated?.audioClip) {
      try {
        transcript = await transcribeBase64Audio(updated.audioClip);
      } catch (error) {
        console.error('[Emergency] Transcription failed:', error);
        transcript = undefined;
      }
    }

    try {
      const analysisObj = await analyzeEmergency({
        transcript: transcript || '',
        location,
      });
      const aiAnalysis = JSON.stringify(analysisObj);
      const updateData: any = { aiAnalysis };
      if (transcript) updateData.transcript = transcript;
      await EmergencyAlert.findByIdAndUpdate(id, updateData);

      const analyzedPayload = { alertId: id, status: 'calling', aiAnalysis, transcript, elderlyId, elderlyName, contactPhone, location };
      if (receivers.length === 0) {
        io.emit('emergency:updated', analyzedPayload);
      } else {
        emitToReceivers(io, receivers, 'emergency:updated', analyzedPayload);
      }
    } catch (e) {
      console.error('[Emergency] Background analyze failed:', e);
    }
  });
};
