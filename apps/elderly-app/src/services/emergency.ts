import request from '../utils/request';

export async function initiate(): Promise<{ alertId: string }> {
  // 从本地存储获取老人的用户信息
  const userInfo = localStorage.getItem('userInfo');
  if (!userInfo) {
    throw new Error('未找到用户信息');
  }
  const user = JSON.parse(userInfo);
  const userId = user._id; // 使用 _id 字段
  if (!userId) {
    throw new Error('未找到用户ID');
  }
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
  const res = await request.post(`/emergency/${id}/commit`, body);
  return res.data;
}