import { Request, Response } from 'express';
import { ElderHealthArchive } from '../models/elderhealth.model';
import { User } from '../models/user.model';

export class ElderHealthController {
  /**
   * 获取老人的健康档案
   */
  static async getElderHealthArchive(req: Request, res: Response) {
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

      // 获取健康档案
      const healthArchive = await ElderHealthArchive.findOne({ elderID: elderlyId });

      if (!healthArchive) {
        // 如果没有健康档案，返回默认值
        const defaultArchive = {
          id: '',
          elderID: elderlyId,
          name: elderly.realname || elderly.username,
          age: 0,
          phone: elderly.phone,
          address: '',
          emcontact: {
            username: '',
            phone: '',
            realname: ''
          },
          medicals: [],
          allergies: [],
          useMedication: []
        };

        return res.json({
          code: 200,
          message: '获取成功',
          data: defaultArchive
        });
      }

      return res.json({
        code: 200,
        message: '获取成功',
        data: {
          id: healthArchive._id,
          elderID: healthArchive.elderID,
          name: healthArchive.name,
          age: healthArchive.age,
          phone: healthArchive.phone,
          address: healthArchive.address,
          emcontact: healthArchive.emcontact,
          medicals: healthArchive.medicals,
          allergies: healthArchive.allergies,
          useMedication: healthArchive.useMedication,
          bloodPressure: (healthArchive as any).bloodPressure,
          bloodSugar: (healthArchive as any).bloodSugar,
          heartRate: (healthArchive as any).heartRate,
          oxygenLevel: (healthArchive as any).oxygenLevel,
          temperature: (healthArchive as any).temperature,
          updatedAt: (healthArchive as any).updatedAt,
          createdAt: (healthArchive as any).createdAt
        }
      });
    } catch (error) {
      console.error('获取老人健康档案失败:', error);
      return res.json({
        code: 500,
        message: '获取老人健康档案失败',
        data: null
      });
    }
  }

  /**
   * 获取所有老人的健康档案
   */
  static async getAllElderHealthArchives(req: Request, res: Response) {
    try {
      const { page = 1, limit = 20 } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      // 获取总数
      const total = await ElderHealthArchive.countDocuments();

      // 获取健康档案列表
      const healthArchives = await ElderHealthArchive.find()
        .populate('elderID', 'username realname phone avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit));

      const formattedArchives = healthArchives.map(archive => ({
        id: archive._id,
        elderID: archive.elderID,
        name: archive.name,
        age: archive.age,
        phone: archive.phone,
        address: archive.address,
        emcontact: archive.emcontact,
        medicals: archive.medicals,
        allergies: archive.allergies,
        useMedication: archive.useMedication,
        bloodPressure: (archive as any).bloodPressure,
        bloodSugar: (archive as any).bloodSugar,
        heartRate: (archive as any).heartRate,
        oxygenLevel: (archive as any).oxygenLevel,
        temperature: (archive as any).temperature,
        updatedAt: (archive as any).updatedAt,
        createdAt: (archive as any).createdAt
      }));

      return res.json({
        code: 200,
        message: '获取成功',
        data: {
          list: formattedArchives,
          total,
          page: Number(page),
          limit: Number(limit)
        }
      });
    } catch (error) {
      console.error('获取老人健康档案列表失败:', error);
      return res.json({
        code: 500,
        message: '获取老人健康档案列表失败',
        data: null
      });
    }
  }

  /**
   * 创建或更新老人健康档案
   */
  static async createOrUpdateElderHealthArchive(req: Request, res: Response) {
    try {
      const { elderID, name, age, phone, address, emcontact, medicals, allergies, useMedication, bloodPressure, bloodSugar, heartRate, oxygenLevel, temperature } = req.body;

      // 验证老人ID是否存在
      const elderly = await User.findById(elderID);
      if (!elderly || elderly.role !== 'elderly') {
        return res.json({
          code: 404,
          message: '老人不存在',
          data: null
        });
      }

      // 查找现有档案或创建新档案
      let healthArchive = await ElderHealthArchive.findOne({ elderID });

      if (healthArchive) {
        // 更新现有档案 - 只更新提供的字段
        const updateFields: any = {};
        if (name !== undefined) updateFields.name = name;
        if (age !== undefined) updateFields.age = age;
        if (phone !== undefined) updateFields.phone = phone;
        if (address !== undefined) updateFields.address = address;
        if (emcontact !== undefined) updateFields.emcontact = emcontact;
        if (medicals !== undefined) updateFields.medicals = medicals;
        if (allergies !== undefined) updateFields.allergies = allergies;
        if (useMedication !== undefined) updateFields.useMedication = useMedication;
        if (bloodPressure !== undefined) updateFields.bloodPressure = bloodPressure;
        if (bloodSugar !== undefined) updateFields.bloodSugar = bloodSugar;
        if (heartRate !== undefined) updateFields.heartRate = heartRate;
        if (oxygenLevel !== undefined) updateFields.oxygenLevel = oxygenLevel;
        if (temperature !== undefined) updateFields.temperature = temperature;

        const updatedArchive = await ElderHealthArchive.findOneAndUpdate(
          { elderID },
          { $set: updateFields },
          { new: true, runValidators: true }
        );

        if (!updatedArchive) {
          return res.json({
            code: 500,
            message: '更新档案失败',
            data: null
          });
        }

        healthArchive = updatedArchive;
      } else {
        // 创建新档案
        const newArchive = await ElderHealthArchive.create({
          elderID,
          name,
          age,
          phone,
          address,
          emcontact,
          medicals,
          allergies,
          useMedication,
          bloodPressure,
          bloodSugar,
          heartRate,
          oxygenLevel,
          temperature
        });

        if (!newArchive) {
          return res.json({
            code: 500,
            message: '创建档案失败',
            data: null
          });
        }

        healthArchive = newArchive;
      }

      // 确保 healthArchive 不为 null
      if (!healthArchive) {
        return res.json({
          code: 500,
          message: '操作失败',
          data: null
        });
      }

      return res.json({
        code: 200,
        message: '操作成功',
        data: {
          id: healthArchive._id,
          elderID: healthArchive.elderID,
          name: healthArchive.name,
          age: healthArchive.age,
          phone: healthArchive.phone,
          address: healthArchive.address,
          emcontact: healthArchive.emcontact,
          medicals: healthArchive.medicals,
          allergies: healthArchive.allergies,
          useMedication: healthArchive.useMedication,
          bloodPressure: (healthArchive as any).bloodPressure,
          bloodSugar: (healthArchive as any).bloodSugar,
          heartRate: (healthArchive as any).heartRate,
          oxygenLevel: (healthArchive as any).oxygenLevel,
          temperature: (healthArchive as any).temperature
        }
      });
    } catch (error) {
      console.error('创建或更新老人健康档案失败:', error);
      return res.json({
        code: 500,
        message: '创建或更新老人健康档案失败',
        data: null
      });
    }
  }

  /**
   * 更新老人生命体征（专为护士端设计，支持查询参数elderId）
   */
  static async updateVitals(req: Request, res: Response) {
    try {
      const elderIdFromQuery = (req.query.elderId as string) || null;
      const elderIdFromBody = req.body.elderID || null;
      const elderID = elderIdFromQuery || elderIdFromBody;

      if (!elderID) {
        return res.json({
          code: 400,
          message: '缺少elderID参数',
          data: null
        });
      }

      // 验证老人ID是否存在
      const elderly = await User.findById(elderID);
      if (!elderly || elderly.role !== 'elderly') {
        return res.json({
          code: 404,
          message: '老人不存在',
          data: null
        });
      }

      const { temperature, bloodSugar, bloodPressure, heartRate, oxygenLevel } = req.body;

      // 构建更新对象（仅更新提供的字段）
      const updateFields: any = {};
      if (temperature !== undefined) updateFields.temperature = Number(temperature);
      if (bloodSugar !== undefined) updateFields.bloodSugar = Number(bloodSugar);
      if (heartRate !== undefined) updateFields.heartRate = Number(heartRate);
      if (oxygenLevel !== undefined) updateFields.oxygenLevel = Number(oxygenLevel);
      if (bloodPressure !== undefined) {
        const bpStr = String(bloodPressure).trim();
        const ok = /^\d+\/\d+$/.test(bpStr);
        if (!ok) {
          return res.json({ code: 400, message: "血压格式应为 收缩压/舒张压（如120/80）", data: null });
        }
        updateFields.bloodPressure = bpStr;
      }

      if (Object.keys(updateFields).length === 0) {
        return res.json({
          code: 400,
          message: '没有需要更新的字段',
          data: null
        });
      }

      // 查找现有档案
      let healthArchive = await ElderHealthArchive.findOne({ elderID });

      if (!healthArchive) {
        // 如果没有档案，先创建一个基础档案
        healthArchive = await ElderHealthArchive.create({
          elderID,
          name: elderly.realname || elderly.username,
          phone: elderly.phone,
          ...updateFields
        });
      } else {
        // 更新现有档案
        healthArchive = await ElderHealthArchive.findOneAndUpdate(
          { elderID },
          { $set: updateFields, $currentDate: { updatedAt: true } },
          { new: true, runValidators: true }
        );
      }

      if (!healthArchive) {
        return res.json({
          code: 500,
          message: '更新失败',
          data: null
        });
      }

      return res.json({
        code: 200,
        message: '保存成功',
        data: {
          id: healthArchive._id,
          elderID: healthArchive.elderID,
          name: healthArchive.name,
          age: healthArchive.age,
          phone: healthArchive.phone,
          address: healthArchive.address,
          emcontact: healthArchive.emcontact,
          medicals: healthArchive.medicals,
          allergies: healthArchive.allergies,
          useMedication: healthArchive.useMedication,
          bloodPressure: (healthArchive as any).bloodPressure,
          bloodSugar: (healthArchive as any).bloodSugar,
          heartRate: (healthArchive as any).heartRate,
          oxygenLevel: (healthArchive as any).oxygenLevel,
          temperature: (healthArchive as any).temperature,
          updatedAt: (healthArchive as any).updatedAt,
          createdAt: (healthArchive as any).createdAt
        }
      });
    } catch (error) {
      console.error('更新生命体征失败:', error);
      return res.json({
        code: 500,
        message: '更新生命体征失败',
        data: null
      });
    }
  }

  /**
   * 初始化老人健康档案（专为护士端设计，支持查询参数elderId）
   */
  static async initElderHealthArchive(req: Request, res: Response) {
    try {
      const elderIdFromQuery = (req.query.elderId as string) || null;
      const elderIdFromBody = req.body.elderID || null;
      const elderID = elderIdFromQuery || elderIdFromBody;

      if (!elderID) {
        return res.json({
          code: 400,
          message: '缺少elderID参数',
          data: null
        });
      }

      // 验证老人ID是否存在
      const elderly = await User.findById(elderID);
      if (!elderly || elderly.role !== 'elderly') {
        return res.json({
          code: 404,
          message: '老人不存在',
          data: null
        });
      }

      // 查找现有档案
      let healthArchive = await ElderHealthArchive.findOne({ elderID });

      if (!healthArchive) {
        // 如果没有档案，创建一个基础档案
        healthArchive = await ElderHealthArchive.create({
          elderID,
          name: elderly.realname || elderly.username,
          phone: elderly.phone,
          medicals: [],
          allergies: [],
          useMedication: []
        });
      }

      return res.json({
        code: 200,
        message: 'ok',
        data: {
          id: healthArchive._id,
          elderID: healthArchive.elderID,
          name: healthArchive.name,
          age: healthArchive.age,
          phone: healthArchive.phone,
          address: healthArchive.address,
          emcontact: healthArchive.emcontact,
          medicals: healthArchive.medicals,
          allergies: healthArchive.allergies,
          useMedication: healthArchive.useMedication,
          bloodPressure: (healthArchive as any).bloodPressure,
          bloodSugar: (healthArchive as any).bloodSugar,
          heartRate: (healthArchive as any).heartRate,
          oxygenLevel: (healthArchive as any).oxygenLevel,
          temperature: (healthArchive as any).temperature,
          updatedAt: (healthArchive as any).updatedAt,
          createdAt: (healthArchive as any).createdAt
        }
      });
    } catch (error) {
      console.error('初始化健康档案失败:', error);
      return res.json({
        code: 500,
        message: '初始化健康档案失败',
        data: null
      });
    }
  }
}
