import { http } from '../utils/request';

export type ApproveStatus = 'pending' | 'approved' | 'rejected';

export interface ApproveRecord {
    id?: string;
    _id?: string;
    nurseId?: string;
    nurseName: string;
    phone?: string;
    idCardFront: string;
    idCardBack: string;
    certificateImage: string;
    certificateType?: string;
    certificateNo?: string;
    status?: ApproveStatus;
    submitTime?: string;
    reviewTime?: string;
    rejectReason?: string;
}

export interface CreateApprovePayload {
    nurseName: string;
    phone?: string;
    idCardFront: string;
    idCardBack: string;
    certificateImage: string;
    certificateType?: string;
    certificateNo?: string;
}

export class ApproveService {
    // 创建审批记录
    static async create(payload: CreateApprovePayload) {
        return http.post<ApproveRecord>('/approves', payload);
    }

    // 列表
    static async list() {
        return http.get<ApproveRecord[]>('/approves');
    }

    // 更新（兼容不同后端实现：优先 PUT，失败 fallback PATCH）
    static async update(id: string, body: Partial<ApproveRecord>) {
        try {
            return await http.put<ApproveRecord>(`/approves/${id}`, body);
        } catch (e) {
            // 尝试 PATCH
            return await http.patch<ApproveRecord>(`/approves/${id}`, body);
        }
    }

    // 创建后补齐关键字段（某些后端会忽略字段或写默认值，这里兜底修复）
    static async createWithFallback(payload: CreateApprovePayload) {
        const created = await this.create(payload);
        const createdId = (created?.data as any)?.id || (created?.data as any)?._id;

        // 如果后端返回的列表里字段仍是占位或缺失，则补齐
        try {
            if (createdId) {
                const patchPayload: Partial<ApproveRecord> = {
                    phone: payload.phone,
                    certificateNo: payload.certificateNo,
                    certificateType: payload.certificateType,
                };
                await this.update(createdId, patchPayload);
            }
        } catch { }

        return created;
    }
}

export default ApproveService;



