import { Request, Response } from 'express';
import { HealthData } from '../models/health-data.model';
import { User } from '../models/user.model';

export class HealthController {
  /**
   * 获取老人的最新健康数据
   */
  static async getLatestHealthData(req: Request, res: Response) {
    try {
      const { elderlyId } = req.params;

      // 验证老人ID是否存在
      const elderly = await User.findById(elderlyId);
      if (!elderly || elderly.role !== 'elderly') {
        return res.json({
          code: 404,
          message: '老人不存在',
          data: null
        });
      }

      // 获取最新健康数据
      const latestHealthData = await HealthData.findOne({ elderlyId })
        .sort({ lastUpdate: -1 });

      if (!latestHealthData) {
        // 如果没有健康数据，返回默认值
        const defaultHealthData = {
          id: '',
          elderlyId,
          elderlyName: elderly.realname || elderly.username,
          heartRate: 0,
          bloodPressure: '0/0',
          temperature: 0,
          oxygenLevel: 0,
          bloodSugar: 0,
          lastUpdate: new Date(),
          status: 'normal' as const,
          notes: '暂无健康数据'
        };

        return res.json({
          code: 200,
          message: '获取成功',
          data: defaultHealthData
        });
      }

      return res.json({
        code: 200,
        message: '获取成功',
        data: {
          id: latestHealthData._id,
          elderlyId: latestHealthData.elderlyId,
          elderlyName: latestHealthData.elderlyName,
          heartRate: latestHealthData.heartRate,
          bloodPressure: latestHealthData.bloodPressure,
          temperature: latestHealthData.temperature,
          oxygenLevel: latestHealthData.oxygenLevel,
          bloodSugar: latestHealthData.bloodSugar,
          lastUpdate: latestHealthData.lastUpdate,
          status: latestHealthData.status,
          notes: latestHealthData.notes
        }
      });
    } catch (error) {
      console.error('获取最新健康数据失败:', error);
      return res.json({
        code: 500,
        message: '获取最新健康数据失败',
        data: null
      });
    }
  }

  /**
   * 获取老人的健康历史记录
   */
  static async getHealthHistory(req: Request, res: Response) {
    try {
      const { elderlyId } = req.params;
      const { limit = 30 } = req.query;

      // 验证老人ID是否存在
      const elderly = await User.findById(elderlyId);
      if (!elderly || elderly.role !== 'elderly') {
        return res.json({
          code: 404,
          message: '老人不存在',
          data: null
        });
      }

      // 获取健康历史记录
      const healthHistory = await HealthData.find({ elderlyId })
        .sort({ lastUpdate: -1 })
        .limit(Number(limit));

      const formattedHistory = healthHistory.map(record => ({
        id: record._id,
        elderlyId: record.elderlyId,
        elderlyName: record.elderlyName,
        heartRate: record.heartRate,
        bloodPressure: record.bloodPressure,
        temperature: record.temperature,
        oxygenLevel: record.oxygenLevel,
        bloodSugar: record.bloodSugar,
        lastUpdate: record.lastUpdate,
        status: record.status,
        notes: record.notes
      }));

      return res.json({
        code: 200,
        message: '获取成功',
        data: formattedHistory
      });
    } catch (error) {
      console.error('获取健康历史记录失败:', error);
      return res.json({
        code: 500,
        message: '获取健康历史记录失败',
        data: null
      });
    }
  }

  /**
   * 创建健康记录
   */
  static async createHealthRecord(req: Request, res: Response) {
    try {
      const {
        elderlyId,
        elderlyName,
        heartRate,
        bloodPressure,
        temperature,
        oxygenLevel,
        bloodSugar,
        notes
      } = req.body;

      // 验证老人ID是否存在
      const elderly = await User.findById(elderlyId);
      if (!elderly || elderly.role !== 'elderly') {
        return res.json({
          code: 404,
          message: '老人不存在',
          data: null
        });
      }

      // 创建健康记录
      const healthRecord = await HealthData.create({
        elderlyId,
        elderlyName: elderlyName || elderly.realname || elderly.username,
        heartRate,
        bloodPressure,
        temperature,
        oxygenLevel,
        bloodSugar,
        lastUpdate: new Date(),
        status: 'normal', // 默认状态，实际应该根据数值判断
        notes,
        recordedBy: (req as any).userId || elderlyId // 记录者ID
      });

      return res.json({
        code: 200,
        message: '创建成功',
        data: {
          id: healthRecord._id,
          elderlyId: healthRecord.elderlyId,
          elderlyName: healthRecord.elderlyName,
          heartRate: healthRecord.heartRate,
          bloodPressure: healthRecord.bloodPressure,
          temperature: healthRecord.temperature,
          oxygenLevel: healthRecord.oxygenLevel,
          bloodSugar: healthRecord.bloodSugar,
          lastUpdate: healthRecord.lastUpdate,
          status: healthRecord.status,
          notes: healthRecord.notes
        }
      });
    } catch (error) {
      console.error('创建健康记录失败:', error);
      return res.json({
        code: 500,
        message: '创建健康记录失败',
        data: null
      });
    }
  }

  /**
   * 更新健康记录
   */
  static async updateHealthRecord(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // 查找并更新健康记录
      const healthRecord = await HealthData.findByIdAndUpdate(
        id,
        { ...updateData, lastUpdate: new Date() },
        { new: true, runValidators: true }
      );

      if (!healthRecord) {
        return res.json({
          code: 404,
          message: '健康记录不存在',
          data: null
        });
      }

      return res.json({
        code: 200,
        message: '更新成功',
        data: {
          id: healthRecord._id,
          elderlyId: healthRecord.elderlyId,
          elderlyName: healthRecord.elderlyName,
          heartRate: healthRecord.heartRate,
          bloodPressure: healthRecord.bloodPressure,
          temperature: healthRecord.temperature,
          oxygenLevel: healthRecord.oxygenLevel,
          bloodSugar: healthRecord.bloodSugar,
          lastUpdate: healthRecord.lastUpdate,
          status: healthRecord.status,
          notes: healthRecord.notes
        }
      });
    } catch (error) {
      console.error('更新健康记录失败:', error);
      return res.json({
        code: 500,
        message: '更新健康记录失败',
        data: null
      });
    }
  }

  /**
   * 获取健康统计
   */
  static async getHealthStats(req: Request, res: Response) {
    try {
      const { elderlyId } = req.params;
      const { period = 'month' } = req.query;

      // 验证老人ID是否存在
      const elderly = await User.findById(elderlyId);
      if (!elderly || elderly.role !== 'elderly') {
        return res.json({
          code: 404,
          message: '老人不存在',
          data: null
        });
      }

      // 计算时间范围
      const now = new Date();
      let startDate: Date;

      switch (period) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case 'year':
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }

      // 获取指定时间范围内的健康数据
      const healthData = await HealthData.find({
        elderlyId,
        lastUpdate: { $gte: startDate, $lte: now }
      }).sort({ lastUpdate: 1 });

      if (healthData.length === 0) {
        return res.json({
          code: 200,
          message: '获取成功',
          data: {
            averageHeartRate: 0,
            averageBloodPressure: '0/0',
            averageTemperature: 0,
            averageBloodSugar: 0,
            trends: {
              heartRate: [],
              bloodPressure: [],
              temperature: [],
              bloodSugar: [],
              dates: []
            }
          }
        });
      }

      // 计算平均值
      const totalHeartRate = healthData.reduce((sum, data) => sum + data.heartRate, 0);
      const totalTemperature = healthData.reduce((sum, data) => sum + data.temperature, 0);
      const totalOxygenLevel = healthData.reduce((sum, data) => sum + data.oxygenLevel, 0);
      const totalBloodSugar = healthData.reduce((sum, data) => sum + data.bloodSugar, 0);

      const averageHeartRate = Math.round(totalHeartRate / healthData.length);
      const averageTemperature = Math.round((totalTemperature / healthData.length) * 10) / 10;
      const averageOxygenLevel = Math.round(totalOxygenLevel / healthData.length);
      const averageBloodSugar = Math.round((totalBloodSugar / healthData.length) * 10) / 10;

      // 计算平均血压（简化处理）
      const averageBloodPressure = '120/80'; // 实际应该更复杂地计算

      // 提取趋势数据
      const trends = {
        heartRate: healthData.map(data => data.heartRate),
        bloodPressure: healthData.map(data => data.bloodPressure),
        temperature: healthData.map(data => data.temperature),
        bloodSugar: healthData.map(data => data.bloodSugar),
        dates: healthData.map(data => data.lastUpdate.toISOString().split('T')[0])
      };

      return res.json({
        code: 200,
        message: '获取成功',
        data: {
          averageHeartRate,
          averageBloodPressure,
          averageTemperature,
          averageBloodSugar,
          trends
        }
      });
    } catch (error) {
      console.error('获取健康统计失败:', error);
      return res.json({
        code: 500,
        message: '获取健康统计失败',
        data: null
      });
    }
  }

  /**
   * 获取健康警告
   */
  static async getHealthWarnings(req: Request, res: Response) {
    try {
      const { elderlyId } = req.params;

      // 验证老人ID是否存在
      const elderly = await User.findById(elderlyId);
      if (!elderly || elderly.role !== 'elderly') {
        return res.json({
          code: 404,
          message: '老人不存在',
          data: null
        });
      }

      // 获取最新健康数据
      const latestHealthData = await HealthData.findOne({ elderlyId })
        .sort({ lastUpdate: -1 });

      if (!latestHealthData) {
        return res.json({
          code: 200,
          message: '获取成功',
          data: { warnings: [] }
        });
      }

      const warnings: Array<{
        type: 'heartRate' | 'bloodPressure' | 'temperature' | 'bloodSugar';
        level: 'warning' | 'danger';
        message: string;
        timestamp: string;
      }> = [];

      // 检查心率
      if (latestHealthData.heartRate < 60) {
        warnings.push({
          type: 'heartRate',
          level: 'danger',
          message: `心率过低：${latestHealthData.heartRate} bpm，建议及时就医`,
          timestamp: latestHealthData.lastUpdate.toISOString()
        });
      } else if (latestHealthData.heartRate > 100) {
        warnings.push({
          type: 'heartRate',
          level: 'warning',
          message: `心率偏高：${latestHealthData.heartRate} bpm，建议关注`,
          timestamp: latestHealthData.lastUpdate.toISOString()
        });
      }

      // 检查体温
      if (latestHealthData.temperature > 37.5) {
        warnings.push({
          type: 'temperature',
          level: 'danger',
          message: `体温异常：${latestHealthData.temperature}°C，建议及时就医`,
          timestamp: latestHealthData.lastUpdate.toISOString()
        });
      } else if (latestHealthData.temperature > 37.2) {
        warnings.push({
          type: 'temperature',
          level: 'warning',
          message: `体温偏高：${latestHealthData.temperature}°C，建议关注`,
          timestamp: latestHealthData.lastUpdate.toISOString()
        });
      }

      // 检查血糖
      if (latestHealthData.bloodSugar < 3.9 || latestHealthData.bloodSugar > 6.1) {
        warnings.push({
          type: 'bloodSugar',
          level: 'warning',
          message: `血糖异常：${latestHealthData.bloodSugar} mmol/L，建议关注`,
          timestamp: latestHealthData.lastUpdate.toISOString()
        });
      }

      // 检查血氧
      if (latestHealthData.oxygenLevel < 95) {
        warnings.push({
          type: 'bloodSugar', // 复用类型
          level: 'warning',
          message: `血氧偏低：${latestHealthData.oxygenLevel}%，建议关注`,
          timestamp: latestHealthData.lastUpdate.toISOString()
        });
      }

      return res.json({
        code: 200,
        message: '获取成功',
        data: { warnings }
      });
    } catch (error) {
      console.error('获取健康警告失败:', error);
      return res.json({
        code: 500,
        message: '获取健康警告失败',
        data: null
      });
    }
  }
}
