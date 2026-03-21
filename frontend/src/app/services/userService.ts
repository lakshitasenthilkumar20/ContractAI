import { apiFetch } from './api';

export interface UserResponse {
    id: string;
    full_name: string;
    email: string;
    role: string;
    is_active: boolean;
    assigned_lawyer_id?: string;
    assigned_paralegal_id?: string;
    assigned_lawyer_name?: string;
    assigned_paralegal_name?: string;
}

export const userService = {
    listUsers: async (): Promise<UserResponse[]> => {
        return apiFetch('/users');
    },

    updateUser: async (id: string, data: { role?: string; is_active?: boolean }) => {
        return apiFetch(`/users/${id}`, {
            method: 'PUT',
            data
        });
    }
};
