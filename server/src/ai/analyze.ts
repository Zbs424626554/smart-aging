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
请分析以下紧急情况信息，并提供专业的风险评估和建议。

语音转写内容：${input.transcript || '无语音内容'}
位置信息：${input.location ? `经度${input.location.coordinates[0]}, 纬度${input.location.coordinates[1]}` : '无位置信息'}

请严格按照以下JSON格式返回分析结果，不要包含任何Markdown标记、代码块符号或其他格式字符：

{"riskLevel":"low/medium/high","summary":"简要分析总结","detectedKeywords":["关键词1","关键词2"],"recommendations":["建议1","建议2","建议3"],"needCallEmergency":true/false}

请确保：
1. riskLevel根据紧急程度判断：low(轻微), medium(中等), high(严重)
2. detectedKeywords提取语音中的关键信息
3. recommendations提供具体的行动建议
4. needCallEmergency根据风险等级判断是否需要立即拨打急救电话
5. 返回格式必须是有效的JSON，不能包含任何Markdown标记或代码块符号
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

    try {
      // 清理响应内容，移除可能的Markdown标记
      let cleanResponse = response.trim();

      // 移除可能的代码块标记
      if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse.replace(/^```json\s*/, '');
      }
      if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse.replace(/^```\s*/, '');
      }
      if (cleanResponse.endsWith('```')) {
        cleanResponse = cleanResponse.replace(/\s*```$/, '');
      }

      // 尝试找到JSON内容的开始和结束
      const jsonStart = cleanResponse.indexOf('{');
      const jsonEnd = cleanResponse.lastIndexOf('}');

      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        cleanResponse = cleanResponse.substring(jsonStart, jsonEnd + 1);
      }

      const analysis = JSON.parse(cleanResponse);
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


