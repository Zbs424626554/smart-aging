import { Request, Response } from "express";
import { transcribeBase64Audio } from "../../ai/transcribe";

export class NewDevelopSttController {
  static async transcribe(req: Request, res: Response) {
    try {
      const { base64 } = req.body as { base64?: string };
      if (!base64) {
        return res.json({ code: 400, message: "缺少音频内容", data: null });
      }

      // 若未配置腾讯云密钥，底层会返回空字符串，这里统一提示
      const text = await transcribeBase64Audio(base64);
      if (!text) {
        return res.json({ code: 200, message: "未配置语音识别服务或识别为空", data: { text: "" } });
      }

      return res.json({ code: 200, message: "ok", data: { text } });
    } catch (error: any) {
      console.error("[newDevelop] 语音转写失败:", error);
      return res.status(500).json({ code: 500, message: "服务器错误", data: null });
    }
  }
}

export default NewDevelopSttController;


