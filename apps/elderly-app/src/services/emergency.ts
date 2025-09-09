import request from '../utils/request';

export async function initiate(): Promise<{ alertId: string }> {
  // 优先从 token 解码出当前用户ID，避免本地 userInfo 还未刷新导致取到家属信息
  let userId: string | undefined;
  try {
    const token = localStorage.getItem('token');
    if (token) {
      const payloadBase64 = token.split('.')[1]?.replace(/-/g, '+').replace(/_/g, '/');
      if (payloadBase64) {
        const payload = JSON.parse(atob(payloadBase64));
        userId = payload?.id;
      }
    }
  } catch { }

  // 兜底：从 /auth/profile 获取
  if (!userId) {
    try {
      const prof: any = await request.get('/auth/profile');
      const u = prof?.data?.user || prof?.data;
      userId = u?._id || u?.id;
    } catch { }
  }

  if (!userId) throw new Error('未找到用户ID');

  const res = await request.post<{ alertId: string }>('/emergency/initiate', { userId });
  return res.data;
}

export async function cancel(id: string): Promise<void> {
  await request.post(`/emergency/${id}/cancel`, {});
}

export async function uploadAudioBase64(id: string, base64: string): Promise<void> {
  await request.post(`/emergency/${id}/upload-audio-base64`, { base64 });
}

export async function commit(id: string, body: { location?: { type: 'Point'; coordinates: [number, number] }; base64?: string }) {
  const toSend: any = { ...body };
  if (toSend.base64 && toSend.base64.startsWith('data:')) {
    try { toSend.base64 = String(toSend.base64).split(',')[1]; } catch { /* noop */ }
  }
  const res = await request.post(`/emergency/${id}/commit`, toSend);
  return res.data;
}

export async function getReceivers(alertId?: string): Promise<string[]> {
  const res = await request.get('/emergency/receivers', { params: alertId ? { alertId } : undefined });
  // 兼容 { code, data } 与直接数组两种形式
  const raw = (res as any)?.data ?? res;
  const arr = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
  return arr as string[];
}