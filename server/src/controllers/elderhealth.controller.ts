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
          useMedication: healthArchive.useMedication
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
        useMedication: archive.useMedication
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
      const { elderID, name, age, phone, address, emcontact, medicals, allergies, useMedication } = req.body;

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
        // 更新现有档案
        const updatedArchive = await ElderHealthArchive.findOneAndUpdate(
          { elderID },
          {
            name,
            age,
            phone,
            address,
            emcontact,
            medicals,
            allergies,
            useMedication
          },
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
          useMedication
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
          useMedication: healthArchive.useMedication
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
}
