import { apiFetch } from './api';

export interface RegistrationRequest {
    name: string;
    email: string;
    role: string;
    message: string;
    password?: string;
}

export interface RegistrationResponse {
    id: string;
    name: string;
    email: string;
    role: string;
    message: string;
    created_at: string;
}

export const registrationService = {
    createRegistration: async (data: RegistrationRequest): Promise<RegistrationResponse | any> => {
        return apiFetch('/registrations', {
            method: 'POST',
            data
        });
    },

    listRegistrations: async (): Promise<RegistrationResponse[]> => {
        return apiFetch('/registrations');
    },

    approveRegistration: async (id: string, assignment?: { lawyer_email?: string, paralegal_email?: string }): Promise<any> => {
        return apiFetch(`/registrations/${id}/approve`, {
            method: 'PUT',
            data: assignment || {}
        });
    },

    rejectRegistration: async (id: string): Promise<any> => {
        return apiFetch(`/registrations/${id}`, {
            method: 'DELETE'
        });
    }
};
