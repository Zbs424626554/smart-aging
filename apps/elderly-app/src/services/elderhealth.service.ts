import { http } from "../utils/request";

export interface ElderHealthArchiveDto {
  _id?: string;
  elderID: string;
  name: string;
  age: number;
  phone: string;
  address?: string;
  emcontact: { username: string; phone: string; realname?: string };
  medicals: string[];
  allergies: string[];
  useMedication?: { name: string; time: string }[];
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
    time: string
  ): Promise<ElderHealthArchiveDto> {
    const { data } = await http.post<ElderHealthArchiveDto>(
      "/elderhealth/medication",
      { name, time }
    );
    return data as ElderHealthArchiveDto;
  }

  static async updateAge(age: number): Promise<ElderHealthArchiveDto> {
    const { data } = await http.post<ElderHealthArchiveDto>(
      "/elderhealth/age",
      { age }
    );
    return data as ElderHealthArchiveDto;
  }
}