import OpenAI from 'openai';

export type EmergencyAnalysisInput = {
  transcript?: string;
  location?: { type: 'Point'; coordinates: [number, number] };
};

export type EmergencyAnalysis = {
  riskLevel: 'low' | 'medium' | 'high';
  summary: string;
  detectedKeywords: string[];
  recommendations: string[];
  needCallEmergency?: boolean;
};

// 初始化OpenAI客户端（使用百川智能API）
const createBaichuanClient = () => {
  return new OpenAI({
    apiKey: process.env.BAICHUAN_API_KEY || 'sk-77fa07660b694718d0e5305dd6114ac8',
    baseURL: "https://api.baichuan-ai.com/v1",
  });
};

// AI分析紧急情况
const analyzeWithAI = async (input: EmergencyAnalysisInput): Promise<EmergencyAnalysis> => {
  const client = createBaichuanClient();

  const prompt = `
你是紧急事件助手。请严格按照要求输出，仅输出一个合法 JSON 对象，不要任何 Markdown、反引号、注释或额外文字。

语音转写内容：${input.transcript || '无语音内容'}
位置信息：${input.location ? `经度${input.location.coordinates[0]}, 纬度${input.location.coordinates[1]}` : '无位置信息'}

返回格式示例（字段必须齐全）：
{
  "riskLevel": "low|medium|high",
  "summary": "简要分析总结",
  "detectedKeywords": ["关键词1", "关键词2"],
  "recommendations": ["建议1", "建议2", "建议3"],
  "needCallEmergency": true
}

说明：
- riskLevel 根据紧急程度判断：low(轻微), medium(中等), high(严重)
- detectedKeywords 提取语音关键信息
- recommendations 提供可执行建议
- needCallEmergency 表示是否需要立即拨打急救电话
`;

  try {
    const completion = await client.chat.completions.create({
      model: "Baichuan2-Turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 500
    });

    const response = completion.choices[0].message.content;

    if (!response) {
      console.error('AI响应为空，使用规则分析');
      return fallbackAnalysis(input);
    }

    // 兼容大模型返回包含代码块或解释性文本的情况
    const extractJson = (text: string): string | null => {
      if (!text) return null;
      const trimmed = String(text).trim();
      // ```json\n{...}\n```
      const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
      if (fenced && fenced[1]) return fenced[1].trim();
      // 普通文本中夹带 JSON：提取首尾大括号
      const start = trimmed.indexOf('{');
      const end = trimmed.lastIndexOf('}');
      if (start !== -1 && end !== -1 && end > start) {
        return trimmed.slice(start, end + 1).trim();
      }
      return null;
    };

    // 兼容大模型返回包含代码块或解释性文本的情况
    const extractJson = (text: string): string | null => {
      if (!text) return null;
      const trimmed = String(text).trim();
      // ```json\n{...}\n```
      const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
      if (fenced && fenced[1]) return fenced[1].trim();
      // 普通文本中夹带 JSON：提取首尾大括号
      const start = trimmed.indexOf('{');
      const end = trimmed.lastIndexOf('}');
      if (start !== -1 && end !== -1 && end > start) {
        return trimmed.slice(start, end + 1).trim();
      }
      return null;
    };

    try {
      const analysis = safeParseJson(response);
      return {
        riskLevel: analysis.riskLevel || 'medium',
        summary: analysis.summary || 'AI分析完成',
        detectedKeywords: analysis.detectedKeywords || [],
        recommendations: analysis.recommendations || [],
        needCallEmergency: analysis.needCallEmergency || false,
      };
    } catch (parseError) {
      console.error('AI响应解析失败，使用规则分析:', parseError);
      return fallbackAnalysis(input);
    }
  } catch (error) {
    console.error('AI分析失败，使用规则分析:', error);
    return fallbackAnalysis(input);
  }
};

// 备用规则分析（当AI不可用时使用）
const fallbackAnalysis = (input: EmergencyAnalysisInput): EmergencyAnalysis => {
  const text = (input.transcript || '').toLowerCase();
  const keywords = ['help', '救命', '跌倒', '心脏', '疼', '疼痛', '流血', '头晕', '呼吸', '晕倒', '摔倒'];
  const hit = keywords.filter(k => text.includes(k));

  let risk: EmergencyAnalysis['riskLevel'] = 'medium';
  if (hit.length >= 2) risk = 'high';
  if (hit.length === 0 && text.length < 4) risk = 'medium';

  const recs: string[] = [];
  if (risk === 'high') {
    recs.push('建议立即联系家属并考虑拨打急救电话');
  } else {
    recs.push('建议尽快联系家属确认情况');
  }
  if (input.location?.coordinates) {
    recs.push('已记录位置信息，便于快速定位');
  }

  return {
    riskLevel: risk,
    summary: hit.length ? `检测到可能的紧急关键词：${hit.join('、')}` : '已记录紧急请求，等待进一步确认',
    detectedKeywords: hit,
    recommendations: recs,
    needCallEmergency: risk === 'high',
  };
};

// 主分析函数
export async function analyzeEmergency(input: EmergencyAnalysisInput): Promise<EmergencyAnalysis> {
  // 检查是否有API密钥配置
  if (process.env.BAICHUAN_API_KEY || process.env.VITE_DASHSCOPE_API_KEY) {
    try {
      return await analyzeWithAI(input);
    } catch (error) {
      console.error('AI分析失败，回退到规则分析:', error);
      return fallbackAnalysis(input);
    }
  } else {
    console.log('未配置AI API密钥，使用规则分析');
    return fallbackAnalysis(input);
  }
}


// 安全解析：清理 Markdown/围栏，仅保留第一个 JSON 对象
function safeParseJson(text: string): any {
  let s = (text || '').trim();
  // 去除 ```json / ``` 等围栏
  s = s.replace(/^```json\s*/i, '').replace(/```$/i, '').replace(/```/g, '').trim();
  // 截取第一个 { 到最后一个 }
  const i = s.indexOf('{');
  const j = s.lastIndexOf('}');
  if (i >= 0 && j >= i) {
    s = s.slice(i, j + 1);
  }
  return JSON.parse(s);
}


