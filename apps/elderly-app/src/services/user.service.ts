import { http } from "../utils/request";

// 用户接口
export interface User {
  id: string;
  username: string;
  realname: string;
  phone: string;
  role: "elderly" | "family" | "nurse" | "admin";
  avatar: string;
  status: boolean;
  createdTime: string;
  lastLogin?: string;
}

// API响应接口
export interface UsersResponse {
  list: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class UserService {
  // 创建好友申请
  static async createFriendRequest(payload: FriendRequestPayload) {
    return http.post("/friend/request", payload);
  }

  // 获取收到的好友申请
  static async getReceivedFriendRequests(params: { toUserId?: string; toUsername?: string; status?: string }) {
    return http.get("/friend/requests", { params });
  }

  static async updateFriendRequestStatus(id: string, status: 'approved' | 'rejected') {
    return http.patch(`/friend/request/${id}/status`, { status });
  }
  // 获取所有用户
  static async getUsers(
    params: {
      page?: number;
      limit?: number;
      role?: string;
      status?: boolean;
    } = {}
  ): Promise<UsersResponse> {
    const { data } = await http.get<UsersResponse>("/users", {
      params,
    });
    return data;
  }

  // 根据角色获取用户列表
  static async getUsersByRole(
    role: string,
    params: {
      page?: number;
      limit?: number;
    } = {}
  ): Promise<UsersResponse> {
    const { data } = await http.get<UsersResponse>(`/users/role/${role}`, {
      params,
    });
    return data;
  }

  // 搜索用户
  static async searchUsers(
    keyword: string,
    params: {
      role?: string;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<UsersResponse> {
    const { data } = await http.get<UsersResponse>("/users/search", {
      params: {
        keyword,
        ...params,
      },
    });
    return data;
  }
}
