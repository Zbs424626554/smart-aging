import { http } from '../utils/request';
import type { ApiResponse } from '../utils/request';

export type UiOrderStatus = 'assigned' | 'processing' | 'completed' | 'cancelled';

export interface OrderRecordAddress {
    formatted?: string;
    province?: string;
    city?: string;
    district?: string;
    location?: { type: 'Point'; coordinates: [number, number] };
}

export interface OrderRecord {
    id?: string;
    _id?: string;
    userId?: string;
    nurseId?: string;
    serviceType?: string;
    serviceName?: string;
    userName?: string;
    status?: string;
    uiStatus: UiOrderStatus;
    orderTime?: string;
    startTime?: string;
    endTime?: string;
    duration?: number;
    price?: number;
    paymentStatus?: string;
    address?: OrderRecordAddress | string; // 兼容历史数据为字符串的情况
    remarks?: string; // 订单备注/要求
    elderlyId?: string;
    healthSnapshot?: {
        bloodPressure?: string;
        bloodSugar?: number;
    };
}

export class OrderService {
    static async listAvailable(): Promise<ApiResponse<OrderRecord[]>> {
        return http.get<OrderRecord[]>('/orders/available');
    }

    static async listMine(): Promise<ApiResponse<OrderRecord[]>> {
        return http.get<OrderRecord[]>('/orders/my');
    }

    static async assignToMe(orderId: string): Promise<ApiResponse<OrderRecord>> {
        return http.patch<OrderRecord>(`/orders/${orderId}/assign-me`);
    }

    static async updateStatus(orderId: string, status: UiOrderStatus): Promise<ApiResponse<OrderRecord>> {
        return http.patch<OrderRecord>(`/orders/${orderId}/status`, { status });
    }

    static async getDetail(orderId: string): Promise<ApiResponse<OrderRecord>> {
        return http.get<OrderRecord>(`/orders/detail/${orderId}`);
    }
}


