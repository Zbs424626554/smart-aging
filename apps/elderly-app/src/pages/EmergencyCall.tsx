import { useRef, useState } from 'react';
import { Toast } from 'antd-mobile';
import { PhoneFill } from 'antd-mobile-icons';
import { speak } from '../utils/tts';
import { MicRecorder, blobToBase64 } from '../utils/recorder';
import { getFixedLocation } from '../utils/location';
import * as emergency from '../services/emergency';
import { MessageService } from '../services/message.service';
import { useNavigate } from 'react-router-dom';

export default function EmergencyCall() {
  const navigate = useNavigate();
  const recorderRef = useRef<MicRecorder | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [alertId, setAlertId] = useState<string | null>(null);

  const timerRef = useRef<number | null>(null);
  const alertIdRef = useRef<string | null>(null); // 使用 ref 保存 alertId，避免异步问题

  const start = async () => {
    const res = await emergency.initiate();
    const id = res.alertId;
    setAlertId(id);
    alertIdRef.current = id; // 同时保存到 ref 中
    recorderRef.current = new MicRecorder();
    try {
      await recorderRef.current.start();
    } catch (e) {
      Toast.show({ content: '录音权限未开启或不受支持，但仍可发送求助' });
    }

    // 使用固定定位（保定理工东院）
    const locationPromise = Promise.resolve(getFixedLocation());

    speak('将在五秒后给紧急联系人打电话');
    setCountdown(5);
    if (timerRef.current) window.clearInterval(timerRef.current);
    const t = window.setInterval(() => {
      setCountdown(prev => {
        const newCount = (prev ?? 0) - 1;
        if (newCount <= 0) {
          if (timerRef.current) window.clearInterval(timerRef.current);
          timerRef.current = null;
          // 传递定位Promise给confirmCall
          confirmCall(locationPromise);
          return null;
        }
        return newCount;
      });
    }, 1000);
    timerRef.current = t as unknown as number;
  };

  const cancel = async () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (alertIdRef.current) await emergency.cancel(alertIdRef.current);
    if (recorderRef.current) {
      try { await recorderRef.current.stop(); } catch { }
    }
    Toast.show({ content: '已取消' });
    setAlertId(null);
    setCountdown(null);
  };

  const confirmCall = async (locationPromise?: Promise<any>) => {
    // 优先使用 ref 中的 alertId，避免状态更新延迟问题
    const savedAlertId = alertIdRef.current || alertId;
    if (!savedAlertId) {
      Toast.show({ content: '操作失败：无效的请求ID' });
      return;
    }

    let location: any = undefined;
    let base64: string | undefined = undefined;

    // 停止录音并转换为 base64（失败也继续）
    try {
      const blob = await recorderRef.current!.stop();
      base64 = await blobToBase64(blob);
    } catch (e) {
      // 录音失败，继续执行
    }

    // 等待定位结果（最多等待1秒，避免阻塞太久）
    try {
      if (locationPromise) {
        // 设置1秒超时，确保不会等待太久
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('定位超时')), 1000)
        );
        location = await Promise.race([locationPromise, timeoutPromise]);
      }
    } catch (e: any) {
      // 定位失败，继续执行
    }

    // 提交请求（包含录音、定位、转文字）
    try {
      await emergency.commit(savedAlertId, { location, base64 });
      // 显著提示
      Toast.show({ content: '已通知紧急联系人，正在连接…', duration: 2000 });
    } catch (commitError) {
      Toast.show({ content: '操作失败' });
    }

    // 清理状态
    setAlertId(null);
    alertIdRef.current = null;
    setCountdown(null);
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // 立即发起应用内语音通话：根据档案获取紧急联系人用户名，创建会话并跳转
    try {
      console.log('[Emergency] creating conversation & jumping to chat...');
      const receivers = await emergency.getReceivers(savedAlertId);
      console.log('[Emergency] receivers=', receivers);
      if (receivers.length) {
        const meUser = JSON.parse(localStorage.getItem('userInfo') || '{}');
        const myUsername = meUser?.username || meUser?.realname || '';
        // 兜底：若 userInfo 不在，尝试从 token 解码
        if (!myUsername) {
          try {
            const token = localStorage.getItem('token');
            if (token) {
              const payloadBase64 = token.split('.')[1]?.replace(/-/g, '+').replace(/_/g, '/');
              const payload = payloadBase64 ? JSON.parse(atob(payloadBase64)) : null;
              if (payload?.username) (meUser as any).username = payload.username;
            }
          } catch { }
        }
        const elderUsername = (meUser as any)?.username || '';
        const familyUsername = receivers[0];
        // 优先尝试原子 get-or-create，单次往返快返 conversationId
        const createRes: any = await MessageService.getOrCreateConversation({
          participants: [
            { username: elderUsername, role: 'elderly' },
            { username: familyUsername, role: 'family' }
          ],
          initialMessage: {
            content: JSON.stringify({ kind: 'voice_call_invite', alertId: savedAlertId }),
            type: 'voice_call'
          }
        });
        const conversationId = createRes?.data?.conversationId || createRes?.conversationId || createRes?.id;
        console.log('[Emergency] created conversationId=', conversationId, 'resp=', createRes);
        if (conversationId) {
          navigate(`/chat/${conversationId}?call=1&alertId=${savedAlertId}`);
        }
      } else {
        console.warn('[Emergency] no receivers');
      }
    } catch (e) {
      console.error('[Emergency] jump chat failed', e);
      // 兜底：降级为 /send 创建后端会话
      try {
        const meUser = JSON.parse(localStorage.getItem('userInfo') || '{}');
        const myUsername = meUser?.username || meUser?.realname || '';
        const receivers = await emergency.getReceivers(savedAlertId!);
        const familyUsername = receivers[0];
        const fallbackRes: any = await MessageService.sendMessageByPair({
          sender: myUsername,
          receiver: familyUsername,
          content: JSON.stringify({ kind: 'voice_call_invite', alertId: savedAlertId }),
          type: 'voice_call',
          senderRole: 'elderly',
          receiverRole: 'family',
          senderRealname: myUsername,
          receiverRealname: familyUsername
        });
        const cid = fallbackRes?.data?.conversationId || fallbackRes?.conversationId;
        if (cid) navigate(`/chat/${cid}?call=1&alertId=${savedAlertId}`);
      } catch (e2) { console.error('[Emergency] fallback send failed', e2); }
    }
  };

  return (
    <div style={{ padding: '0.24rem', width: '100%' }}>
      <div style={{ textAlign: 'center', fontSize: '0.6rem', fontWeight: 800, marginBottom: '1.5rem' }}>紧急呼叫</div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* 外环光晕 */}
        <div
          onClick={() => (countdown === null ? start() : cancel())}
          style={{
            width: '6.2rem',
            height: '6.2rem',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(255,255,255,0.95) 40%, rgba(255,76,61,0.2) 100%)',
            boxShadow: '0 0 0.24rem rgba(255,255,255,0.95), 0 0 0.6rem rgba(243,67,61,0.45), 0 0 1rem rgba(243,67,61,0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          {/* 内部红色圆 */}
          <div
            style={{
              width: '5.2rem',
              height: '5.2rem',
              borderRadius: '50%',
              background: 'linear-gradient(180deg, #f3433d 0%, #d9363e 100%)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              gap: '0.12rem',
              fontWeight: 800,
              textShadow: '0 0 0.06rem rgba(0,0,0,0.15)'
            }}
            aria-label="一键呼叫"
          >
            <div style={{ lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <PhoneFill style={{ fontSize: '2.5rem' }} />
            </div>
            <div style={{ fontSize: '0.48rem' }}>{countdown === null ? '一键呼叫' : '取消'}</div>
          </div>
        </div>
      </div>

      {countdown !== null && (
        <div style={{ marginTop: '0.4rem', fontSize: '0.34rem', textAlign: 'center', color: '#f3433d', fontWeight: 700 }}>
          将在 {countdown} 秒后呼叫，正在录音…
        </div>
      )}

      {/* 单一主按钮已集成到圆形按钮点击 */}
    </div>
  );
}