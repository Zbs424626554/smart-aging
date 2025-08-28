import { Request, Response } from "express";
import { Order } from "../../models/order.model";

export class ElderOrderController {
  static async getMyOrders(req: Request, res: Response) {
    try {
      const orders = await Order.find({});

      return res.json({
        code: 200,
        message: "获取订单列表成功",
        data: {
          list: orders,
        },
      });
    } catch (error) {
      console.error("获取订单列表失败:", error);
      return res
        .status(500)
        .json({ code: 500, message: "获取订单列表失败", data: null });
    }
  }
}

export default ElderOrderController;
