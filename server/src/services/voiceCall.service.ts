
export type VoiceCallResult = {
  called: boolean;
  provider?: 'aliyun' | 'sinch';
  sid?: string;
  reason?: string;
};

/**
 * 统一的外呼接口。根据环境变量选择供应商。
 *
 * 环境变量：
 *  - ENABLE_VOICE_CALL=true
 *  - VOICE_PROVIDER=twilio|aliyun
 *  - TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM
 *  - ALIYUN_ACCESS_KEY_ID, ALIYUN_ACCESS_KEY_SECRET, ALIYUN_CALL_SHOW_NUMBER, ALIYUN_TTS_CODE (可选)
 */
export async function placeEmergencyCall(toPhone: string, message: string): Promise<VoiceCallResult> {
  if (process.env.ENABLE_VOICE_CALL !== 'true') {
    return { called: false, reason: 'voice call disabled' };
  }

  const provider = (process.env.VOICE_PROVIDER || 'sinch') as 'aliyun' | 'sinch';

  if (provider === 'aliyun') {
    // 这里可接入阿里云语音通知（Dyvms）SDK或OpenAPI调用
    // 文档：https://help.aliyun.com/zh/dyvms/user-guide/api-overview
    // 占位返回，未实现
    return { called: false, provider: 'aliyun', reason: 'aliyun not implemented' };
  }

  if (provider === 'sinch') {
    const key = process.env.SINCH_SECRET_ID || process.env.SINCH_APPLICATION_KEY; // 兼容两种命名
    const secret = process.env.SINCH_SECRET_KEY || process.env.SINCH_APPLICATION_SECRET;
    const from = process.env.SINCH_NUMBER;
    const locale = process.env.SINCH_LOCALE || 'zh-CN';
    if (!key || !secret || !from) {
      return { called: false, provider: 'sinch', reason: 'sinch credentials missing' };
    }
    try {
      const to = normalizeToE164(toPhone);
      const basicAuthentication = `${key}:${secret}`;
      // 动态导入 cross-fetch
      const mod: any = await import('cross-fetch');
      const fetchFn = mod.default || mod;
      const ttsBody = {
        method: 'ttsCallout',
        ttsCallout: {
          cli: from,
          destination: { type: 'number', endpoint: to },
          locale,
          text: message || 'This is a call from Sinch.'
        }
      };
      const resp = await fetchFn('https://calling.api.sinch.com/calling/v1/callouts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Basic ' + Buffer.from(basicAuthentication).toString('base64')
        },
        body: JSON.stringify(ttsBody)
      });
      const json = await resp.json();
      const sid = json?.callId || json?.id || undefined;
      if (resp.ok) return { called: true, provider: 'sinch', sid };
      return { called: false, provider: 'sinch', reason: JSON.stringify(json) };
    } catch (e: any) {
      return { called: false, provider: 'sinch', reason: e?.message || 'sinch call failed' };
    }
  }

  return { called: false, reason: 'unknown provider' };
}

function normalizeToE164(raw: string): string {
  const trimmed = (raw || '').replace(/\s|-/g, '');
  if (!trimmed) return raw;
  if (trimmed.startsWith('+')) return trimmed; // 已是E.164
  // 简单中国大陆规则：11位以1开头 → +86 前缀
  if (/^1\d{10}$/.test(trimmed)) {
    const cc = process.env.DEFAULT_COUNTRY_CODE || '+86';
    return `${cc}${trimmed}`;
  }
  return trimmed;
}


