import { http } from "../utils/request";

export interface ElderHealthArchiveDto {
  _id?: string;
  elderID: string;
  name: string;
  gender?: string;
  age: number;
  phone: string;
  address?: string;
  emcontact: { username: string; phone: string; realname?: string };
  medicals: string[];
  allergies: string[];
  // 兼容旧结构：{ name, time }
  useMedication?: Array<{ name: string; time?: string; times?: string[] }>;
  // 扩展：健康状态字段与时间
  heightCm?: number;
  weightKg?: number;
  heartRate?: number;
  bloodPressure?: string;
  temperature?: number;
  oxygenLevel?: number;
  bloodSugar?: number;
  createdAt?: string;
  updatedAt?: string;
}

export class ElderHealthService {
  static async getMyArchive(): Promise<ElderHealthArchiveDto | null> {
    const { data } = await http.get<ElderHealthArchiveDto | null>(
      "/elderhealth/me"
    );
    return data || null;
  }

  // newDevelop: 删除用药时间设置
  static async deleteMedicationND(
    name: string,
    time?: string
  ): Promise<ElderHealthArchiveDto> {
    const { data } = await http.post<ElderHealthArchiveDto>(
      "/elderhealth/medication/delete",
      { name, time }
    );
    // 广播档案更新事件，便于全局用药提醒组件即时刷新
    try {
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("elderhealth:archiveUpdated", { detail: data })
        );
      }
    } catch {
      // ignore
    }
    return data as ElderHealthArchiveDto;
  }

  static async getArchiveByElderId(
    elderId: string
  ): Promise<ElderHealthArchiveDto | null> {
    const { data } = await http.get<ElderHealthArchiveDto | null>(
      `/elderhealth/${elderId}`
    );
    return data || null;
  }

  static async saveEmergencyContact(payload: {
    username?: string;
    realname?: string;
    phone?: string;
  }): Promise<ElderHealthArchiveDto> {
    const { data } = await http.post<ElderHealthArchiveDto>(
      "/elderhealth/emcontact",
      payload
    );
    return data as ElderHealthArchiveDto;
  }

  static async initArchive(): Promise<ElderHealthArchiveDto> {
    const { data } =
      await http.post<ElderHealthArchiveDto>("/elderhealth/init");
    return data as ElderHealthArchiveDto;
  }

  static async updateAddress(address: string): Promise<ElderHealthArchiveDto> {
    const { data } = await http.post<ElderHealthArchiveDto>(
      "/elderhealth/address",
      { address }
    );
    return data as ElderHealthArchiveDto;
  }

  static async updateGender(gender: string): Promise<ElderHealthArchiveDto> {
    const { data } = await http.post<ElderHealthArchiveDto>(
      "/elderhealth/gender",
      { gender }
    );
    return data as ElderHealthArchiveDto;
  }

  static async updateName(name: string): Promise<ElderHealthArchiveDto> {
    const { data } = await http.post<ElderHealthArchiveDto>(
      "/elderhealth/name",
      { name }
    );
    return data as ElderHealthArchiveDto;
  }

  static async addMedical(item: string): Promise<ElderHealthArchiveDto> {
    const { data } = await http.post<ElderHealthArchiveDto>(
      "/elderhealth/medicals",
      { item }
    );
    return data as ElderHealthArchiveDto;
  }

  static async addAllergy(item: string): Promise<ElderHealthArchiveDto> {
    const { data } = await http.post<ElderHealthArchiveDto>(
      "/elderhealth/allergies",
      { item }
    );
    return data as ElderHealthArchiveDto;
  }

  static async addMedication(
    name: string,
    payloadTimes: string[]
  ): Promise<ElderHealthArchiveDto> {
    const { data } = await http.post<ElderHealthArchiveDto>(
      "/elderhealth/medication",
      { name, times: payloadTimes }
    );
    // 广播档案更新事件，便于全局用药提醒组件即时刷新
    try {
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("elderhealth:archiveUpdated", { detail: data })
        );
      }
    } catch {
      // ignore
    }
    return data as ElderHealthArchiveDto;
  }

  static async updateAge(age: number): Promise<ElderHealthArchiveDto> {
    const { data } = await http.post<ElderHealthArchiveDto>(
      "/elderhealth/age",
      { age }
    );
    return data as ElderHealthArchiveDto;
  }

  // newDevelop: 更新身高/体重
  static async updateHeight(heightCm: number): Promise<ElderHealthArchiveDto> {
    const { data } = await http.post<ElderHealthArchiveDto>(
      "/elderhealth/height",
      { heightCm }
    );
    return data as ElderHealthArchiveDto;
  }

  static async updateWeight(weightKg: number): Promise<ElderHealthArchiveDto> {
    const { data } = await http.post<ElderHealthArchiveDto>(
      "/elderhealth/weight",
      { weightKg }
    );
    return data as ElderHealthArchiveDto;
  }
}
