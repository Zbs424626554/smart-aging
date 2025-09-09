import OpenAI from 'openai';
type Role = 'system' | 'user' | 'assistant'
export interface ChatMessage {
  role: Role;
  content: string
}
// 初始化OpenAI客户端（使用百川智能API）
const createBaichuanClient = () => {
  return new OpenAI({
    apiKey: import.meta.env.VITE_DASHSCOPE_API_KEY,
    baseURL: "https://api.baichuan-ai.com/v1",
    dangerouslyAllowBrowser: true // 允许在浏览器中使用
  });
};
const client = createBaichuanClient();


//SDK接口调用
export const streamChat = async (messages: ChatMessage[],
  onChunk: (chunk: string) => void,
  model: string = 'Baichuan2-Turbo') => {
  if (!Array.isArray(messages) || messages.length == 0) {
    throw new Error("messages 必须是至少一条消息的数组");
  }

  const systemMessage: ChatMessage = {
    role: "system",
    content: "请用Markdown格式回复。"
  };
  const completion = await client.chat.completions.create(
    {
      model,
      messages: [systemMessage, ...messages],
      temperature: 0.7,
      stream: true,
      max_tokens: 1000
    }
  )
  let fullText = ''
  console.log(messages);

  for await (const chunk of completion) {
    console.log(chunk.choices[0].delta.content);
    const delta = chunk.choices[0].delta.content;
    if (delta) {
      fullText += delta;
      onChunk(delta);
    }
  }
  return fullText
}



// 调用百川智能模型
const callBaichuan = async (messages: any[], model: string = "Baichuan2-Turbo") => {

  try {
    const completion = await client.chat.completions.create({
      model: model,
      messages: messages,
      temperature: 0.7,
      max_tokens: 1000
    });

    return completion.choices[0].message.content;
  } catch (error: any) {
    console.error("API调用失败:", error);
    throw new Error(`AI服务调用失败: ${error.message || '未知错误'}`);
  }
};

// 简单提问封装
export const askQuestion = async (question: string, model = "Baichuan2-Turbo") => {
  const messages = [
    { role: "user", content: question }
  ];
  return callBaichuan(messages, model);
};

// 生成健康建议
export const generateHealthAdvice = async (healthData: any, elderlyName: string) => {
  console.log('🔍 开始生成AI健康建议...');
  console.log('📊 健康数据:', healthData);
  console.log('👴 老人姓名:', elderlyName);

  // 检查API密钥是否配置
  if (!import.meta.env.VITE_DASHSCOPE_API_KEY) {
    console.warn("⚠️ API密钥未配置，使用默认建议");
    return getDefaultAdvice();
  }

  console.log('✅ API密钥已配置，准备调用百川智能API');

  const prompt = `
请根据以下老人的健康数据，生成3条具体的健康建议。每条建议包含标题和详细描述（3行左右）。

老人姓名：${elderlyName}
健康数据：
- 血压：${healthData.bloodPressure} mmHg
- 血糖：${healthData.bloodSugar} mmol/L
- 心率：${healthData.heartRate} bpm
- 体温：${healthData.temperature} °C

请按照以下JSON格式返回：
{
  "advice": [
    {
      "title": "建议标题",
      "description": "详细描述，3行左右",
      "icon": "建议的emoji图标"
    }
  ]
}

请确保建议具体、实用，针对老人的实际健康状况。
`;

  // console.log('📝 发送给AI的提示词:', prompt);

  try {
    // console.log('🚀 开始调用百川智能API...');
    const response = await askQuestion(prompt);
    // console.log('🤖 AI原始响应:', response);

    if (!response) {
      // console.warn("⚠️ AI响应为空，使用默认建议");
      return getDefaultAdvice();
    }

    // 尝试解析JSON响应
    try {
      const parsedResponse = safeParseJson(response);
      return parsedResponse.advice || [];
    } catch (parseError) {
      // 如果JSON解析失败，返回默认建议
      console.warn("❌ AI响应解析失败，使用默认建议:", parseError);
      console.warn("原始响应:", response);
      return getDefaultAdvice();
    }
  } catch (error) {
    console.error("💥 AI建议生成失败:", error);
    return getDefaultAdvice();
  }
};

// 默认建议（当AI服务不可用时使用）
const getDefaultAdvice = () => {
  return [
    {
      title: "定期运动",
      description: "建议每天进行30分钟轻度运动，如散步、太极拳等，有助于改善血液循环和心肺功能，预防心血管疾病。",
      icon: "🏃‍♂️"
    },
    {
      title: "均衡饮食",
      description: "注意营养搭配，少盐少油，多摄入蔬菜水果，控制血糖和血压，保持健康体重。",
      icon: "🥗"
    },
    {
      title: "充足睡眠",
      description: "保证7-8小时优质睡眠，有助于身体恢复和免疫系统功能，提高生活质量。",
      icon: "😴"
    }
  ];
};

// 统一的 JSON 解析辅助：清理 Markdown/围栏并截取 JSON
function safeParseJson(text: string) {
  if (!text) throw new Error('empty');
  let s = String(text);
  s = s.replace(/^```json\s*/i, '').replace(/```$/i, '').replace(/```/g, '').trim();
  const i = s.indexOf('{');
  const j = s.lastIndexOf('}');
  if (i >= 0 && j >= i) s = s.slice(i, j + 1);
  return JSON.parse(s);
}

