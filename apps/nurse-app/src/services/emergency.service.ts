import { http } from '../utils/request';

export interface EmergencyInitiateResp { alertId: string }

export class EmergencyService {
    static async initiate(): Promise<EmergencyInitiateResp> {
        return http.post<EmergencyInitiateResp>('/emergency/initiate', {}).then(r => r.data);
    }

    static async cancel(id: string): Promise<void> {
        await http.post(`/emergency/${id}/cancel`, {});
    }

    static async commit(id: string, body: { location?: { type: 'Point'; coordinates: [number, number] }; base64?: string }): Promise<any> {
        return http.post(`/emergency/${id}/commit`, body).then(r => r.data);
    }
}




