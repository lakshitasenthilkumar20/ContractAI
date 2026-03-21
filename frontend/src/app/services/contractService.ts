import { apiFetch } from './api';

export interface ContractResponse {
    id: string;
    uploader_id: string;
    client_id?: string;
    title: string;
    filename: string;
    contract_type?: string;
    contract_text?: string;
    status: string;
    uploaded_at: string;
    updated_at?: string;
    client_name?: string;
    paralegal_name?: string;
    lawyer_name?: string;
    paralegal_id?: string;
    lawyer_id?: string;
}

export interface CommentResponse {
    id: string;
    contract_id: string;
    user_id: string;
    user_name: string;
    comment_text: string;
    comment_type: string;
    reply_comment_id?: string;
    created_at: string;
}

export const contractService = {
    listContracts: async (): Promise<ContractResponse[]> => {
        return apiFetch('/contracts');
    },

    getContract: async (id: string): Promise<ContractResponse> => {
        return apiFetch(`/contracts/${id}`);
    },

    uploadContract: async (formData: FormData): Promise<ContractResponse> => {
        // Note: multipart/form-data is handled by fetch automatically when body is FormData
        // So we don't pass 'Content-Type' in apiFetch for this.
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:8000/contracts/upload', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || 'Upload failed');
        }

        return response.json();
    },

    getResults: async (id: string) => {
        return apiFetch(`/contracts/${id}/results`);
    },

    getComments: async (id: string): Promise<CommentResponse[]> => {
        return apiFetch(`/contracts/${id}/comments`);
    },

    addComment: async (contractId: string, commentText: string, commentType: string, replyCommentId?: string) => {
        return apiFetch(`/contracts/${contractId}/comments`, {
            method: 'POST',
            data: {
                comment_text: commentText,
                comment_type: commentType,
                reply_comment_id: replyCommentId
            }
        });
    },

    updateStatus: async (id: string, status: string) => {
        return apiFetch(`/contracts/${id}/status`, {
            method: 'PATCH',
            data: { status }
        });
    },

    assignContract: async (contractId: string, clientId: string) => {
        return apiFetch('/contracts/assign', {
            method: 'POST',
            data: { contract_id: contractId, client_id: clientId }
        });
    }
};
