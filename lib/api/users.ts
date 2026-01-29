/**
 * Users API Client
 */

import apiClient from './client';

export interface User {
  id: string;
  authUserId: string;
  email: string;
  role: string;
  status: string;
  authActive: boolean;
  createdAt: string;
}

export interface InviteUserRequest {
  email: string;
  role: string;
}

export interface UpdateUserRoleRequest {
  role: string;
}

export interface UpdateUserStatusRequest {
  status: string;
}

export const usersApi = {
  /**
   * Get all users
   */
  async getUsers(limit: number = 100, offset: number = 0): Promise<User[]> {
    return apiClient.get<User[]>(`/users?limit=${limit}&offset=${offset}`);
  },

  /**
   * Get a single user by ID
   */
  async getUser(id: string): Promise<User> {
    return apiClient.get<User>(`/users/${id}`);
  },

  /**
   * Invite a new user
   */
  async inviteUser(data: InviteUserRequest): Promise<User> {
    return apiClient.post<User>('/users/invite', data);
  },

  /**
   * Update user role
   */
  async updateUserRole(id: string, role: string): Promise<User> {
    return apiClient.put<User>(`/users/${id}/role`, { role });
  },

  /**
   * Update user status
   */
  async updateUserStatus(id: string, status: string): Promise<User> {
    return apiClient.patch<User>(`/users/${id}/status`, { status });
  },

  /**
   * Remove a user
   */
  async removeUser(id: string): Promise<void> {
    return apiClient.delete<void>(`/users/${id}`);
  },
};

