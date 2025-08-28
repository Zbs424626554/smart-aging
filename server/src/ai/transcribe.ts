
import fs from 'fs';
import path from 'path';
import os from 'os';
import { promisify } from 'util';
import { execFile } from 'child_process';
import ffmpegStatic from 'ffmpeg-static';

/**
 * 将 dataURI/base64 的 WebM/Opus 音频转写为中文文本。
 * - 使用 ffmpeg 将 webm 转为 16k 单声道 WAV PCM s16le
 * - 使用腾讯云 ASR "SentenceRecognition" 接口转写
 * 依赖：tencentcloud-sdk-nodejs、ffmpeg-static
 */
export async function transcribeBase64Audio(base64: string): Promise<string> {
  try {
    const secretId = process.env.TENCENT_SECRET_ID;
    const secretKey = process.env.TENCENT_SECRET_KEY;
    if (!secretId || !secretKey) {
      return '';
    }

    const inputBuf = dataUriToBuffer(base64);
    const { wavPath, cleanup } = await convertWebmToWavTemp(inputBuf);
    const wavBuf = await fs.promises.readFile(wavPath);
    const wavB64 = wavBuf.toString('base64');
    const text = await tencentAsrSentenceRecognition({
      secretId,
      secretKey,
      dataBase64: wavB64,
      dataBytesLength: wavBuf.length,
      engServiceType: '16k_zh',
    });
    await cleanup();
    return text || '';
  } catch (e) {
    console.error('[Transcribe] Error during transcription:', e);
    return '';
  }
}

function dataUriToBuffer(data: string): Buffer {
  if (data.startsWith('data:')) {
    const idx = data.indexOf(',');
    const b64 = data.slice(idx + 1);
    return Buffer.from(b64, 'base64');
  }
  // 可能是纯 base64
  try {
    return Buffer.from(data, 'base64');
  } catch {
    return Buffer.alloc(0);
  }
}

async function convertWebmToWavTemp(webmBuffer: Buffer): Promise<{ wavPath: string; cleanup: () => Promise<void> }> {
  const tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'sa-audio-'));
  const inPath = path.join(tmpDir, 'input.webm');
  const outPath = path.join(tmpDir, 'output.wav');
  await fs.promises.writeFile(inPath, webmBuffer);

  const ffmpegPath = ffmpegStatic as string;
  if (!ffmpegPath) throw new Error('ffmpeg binary not found');
  const execFileAsync = promisify(execFile);
  // 转码：16k、单声道、s16le PCM
  await execFileAsync(ffmpegPath, ['-y', '-i', inPath, '-ac', '1', '-ar', '16000', '-acodec', 'pcm_s16le', outPath]);

  return {
    wavPath: outPath,
    cleanup: async () => {
      try { await fs.promises.unlink(inPath); } catch { }
      try { await fs.promises.unlink(outPath); } catch { }
      try { await fs.promises.rmdir(tmpDir); } catch { }
    }
  };
}

async function tencentAsrSentenceRecognition(params: { secretId: string; secretKey: string; dataBase64: string; dataBytesLength?: number; engServiceType?: string; }): Promise<string> {
  const { secretId, secretKey, dataBase64, dataBytesLength, engServiceType = '16k_zh' } = params;
  // 动态导入，避免没有安装时报错
  const tc = await import('tencentcloud-sdk-nodejs');
  const AsrClient = (tc as any).asr.v20190614.Client;
  const client = new AsrClient({
    credential: { secretId, secretKey },
    region: 'ap-guangzhou',
    profile: { httpProfile: { endpoint: 'asr.tencentcloudapi.com' } }
  });

  const req = {
    EngSerViceType: engServiceType, // 16k中文
    SourceType: 1, // 1: 语音数据
    VoiceFormat: 'wav',
    UsrAudioKey: `key_${Date.now()}`,
    Data: dataBase64,
    // DataLen 需为音频原始字节长度，不能使用 base64 字符串长度
    DataLen: typeof dataBytesLength === 'number' ? dataBytesLength : Buffer.from(dataBase64, 'base64').length,
  };
  const resp = await client.SentenceRecognition(req);
  // 返回字段可能为 Result
  return resp?.Result || '';
}


