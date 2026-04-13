import axios from 'axios';
import type {
  Property,
  Inquiry,
  User,
  CalendarEvent,
  ActivityLog,
  LoginCredentials,
  LoginResponse,
  NewAgent,
  DatabaseOverview,
  FileMetadata
} from '../types';
import { getToken } from '../utils/session';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add JWT token
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Note: Removed automatic session clearing and redirect on 401 errors
    // to prevent premature "session expired" messages
    // Components will handle authentication errors as needed
    if (!error.response && error.request) {
      error.isBackendOffline = true;
    }
    return Promise.reject(error);
  }
);

// Pagination response type (matches MySQL backend format)
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pages: number;
    total: number;
    limit: number;
  };
}

// Properties API
export const propertiesAPI = {
  // Backward compatible - returns all items
  getAll: () => api.get<Property[]>('/properties', { params: { limit: 1000 } }).then(res => {
    // Handle both paginated and non-paginated responses
    if (res.data && typeof res.data === 'object' && 'data' in res.data) {
      const paginatedData = res.data as unknown as PaginatedResponse<Property>;
      return { ...res, data: paginatedData.data };
    }
    return res;
  }),
  // Paginated version
  getAllPaginated: (page?: number, limit?: number) => 
    api.get<PaginatedResponse<Property>>('/properties', { params: { page, limit } }),
  getById: (id: string) => api.get<Property>(`/properties/${id}`),
  create: (property: Partial<Property>) => api.post<Property>('/properties', property),
  createDraft: (property: Partial<Property>) => api.post<Property>('/properties/draft', property),
  update: (id: string, property: Partial<Property>) => api.put<Property>(`/properties/${id}`, property),
  delete: (id: string) => api.delete(`/properties/${id}`),
  toggleVisibility: (id: string, visible: boolean) => api.patch<Property>(`/properties/${id}/visibility`, { visible }),
  uploadImages: (formData: FormData) => 
    api.post<{ imageUrls: string[] }>('/properties/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  getAmenities: (id: string) => api.get<{ data: string[] }>(`/properties/${id}/amenities`),
  updateAmenities: (id: string, amenities: string[]) => api.put(`/properties/${id}/amenities`, { amenities }),
  getAssignmentStatus: () => api.get('/properties/admin/assignment-status'),
  assignAgent: (id: string, payload: { newAgentId: string; reason?: string }) =>
    api.put(`/properties/${id}/assign-agent`, payload),
  getSoldProperties: (page?: number, limit?: number) =>
    api.get<PaginatedResponse<Property>>('/properties/agent/sold', { params: { page, limit } }),
};

// Inquiries API
export const inquiriesAPI = {
  // Backward compatible - returns all items
  getAll: () => api.get<Inquiry[]>('/inquiries', { params: { limit: 1000 } }).then(res => {
    if (res.data && typeof res.data === 'object' && 'data' in res.data) {
      return { ...res, data: (res.data as any).data };
    }
    return res;
  }),
  // Paginated version
  getAllPaginated: (page?: number, limit?: number) => 
    api.get<PaginatedResponse<Inquiry>>('/inquiries', { params: { page, limit } }),
  getById: (id: string) => api.get<Inquiry>(`/inquiries/${id}`),
  create: (inquiry: Partial<Inquiry>) => {
    const customerToken = typeof window !== 'undefined' ? localStorage.getItem('customer_token') : null;
    return api.post<Inquiry>('/inquiries', inquiry, customerToken
      ? { headers: { Authorization: `Bearer ${customerToken}` } }
      : undefined
    );
  },
  update: (id: string, inquiry: Partial<Inquiry>) => api.put<Inquiry>(`/inquiries/${id}`, inquiry),
  delete: (id: string) => api.delete(`/inquiries/${id}`),
  claim: (id: string) => api.post<Inquiry>(`/inquiries/${id}/claim`, {}),
  unclaim: (id: string) => api.post<Inquiry>(`/inquiries/${id}/unclaim`, {}),
  assign: (id: string, agentId: string, agentName: string) =>
    api.post<Inquiry>(`/inquiries/${id}/assign`, { agentId, agentName }),
  reportCustomer: (id: string, payload: { reason: string; details?: string }) =>
    api.post(`/inquiries/${id}/report-customer`, payload),
  getAgentWorkload: () =>
    api.get<Array<{
      agentId: string;
      agentName: string;
      activeInquiries: number;
      totalInquiries: number;
      successfulInquiries: number;
    }>>('/inquiries/agents/workload'),
};

// Users API
export const usersAPI = {
  // Backward compatible - returns all items
  getAll: () => api.get<User[]>('/users', { params: { limit: 1000 } }).then(res => {
    if (res.data && typeof res.data === 'object' && 'data' in res.data) {
      return { ...res, data: (res.data as any).data };
    }
    return res;
  }),
  // Paginated version
  getAllPaginated: (page?: number, limit?: number) => 
    api.get<PaginatedResponse<User>>('/users', { params: { page, limit } }),
  getAgents: () => api.get<User[]>('/users/agents', { params: { limit: 1000 } }).then(res => {
    if (res.data && typeof res.data === 'object' && 'data' in res.data) {
      const paginatedData = res.data as unknown as PaginatedResponse<User>;
      return { ...res, data: paginatedData.data };
    }
    return res;
  }),
  // Paginated version
  getAgentsPaginated: (page?: number, limit?: number) => 
    api.get<PaginatedResponse<User>>('/users/agents', { params: { page, limit } }),
  create: (agent: NewAgent) => api.post<User>('/users', agent),
  delete: (id: string) => api.delete(`/users/${id}`),
  getAgentPerformance: () => api.get('/users/agents/performance'),
  getAgentLicense: (agentId: string) => api.get(`/users/agents/${agentId}/license`),
  getLicenseReport: () => api.get('/users/reports/licenses'),
  downloadAgentLicense: (agentId: string) => api.get(`/users/agents/${agentId}/license/download`, { responseType: 'blob' }),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.put('/users/change-password', { currentPassword, newPassword })
};

// Calendar API
export const calendarAPI = {
  // Backward compatible - returns all items
  getAll: (params?: Record<string, string | number | boolean>) => api.get<CalendarEvent[]>('/calendar', { params: { limit: 1000, ...(params || {}) } }).then(res => {
    if (res.data && typeof res.data === 'object' && 'data' in res.data) {
      const paginatedData = res.data as unknown as PaginatedResponse<CalendarEvent>;
      return { ...res, data: paginatedData.data };
    }
    return res;
  }),
  // Paginated version
  getAllPaginated: (page?: number, limit?: number) => 
    api.get<PaginatedResponse<CalendarEvent>>('/calendar', { params: { page, limit } }),
  getByAgent: (agentId: string) => api.get<CalendarEvent[]>(`/calendar/agent/${agentId}`),
  create: (event: Partial<CalendarEvent>) => api.post<CalendarEvent>('/calendar', event),
  update: (id: string, event: Partial<CalendarEvent>) => api.put<CalendarEvent>(`/calendar/${id}`, event),
  delete: (id: string) => api.delete(`/calendar/${id}`),
  markAsDone: (id: string, inquiryStatus: 'viewed-interested' | 'viewed-not-interested') => 
    api.post(`/calendar/${id}/mark-done`, { inquiryStatus }),
};

// Auth API
export const authAPI = {
  login: (credentials: LoginCredentials) => api.post<LoginResponse>('/login', credentials),
};

// Activity Log API
export const activityLogAPI = {
  // Backward compatible
  getAll: (page?: number, limit?: number) => 
    api.get<{ logs: ActivityLog[]; total: number; page: number; totalPages: number }>(
      '/activity-log',
      { params: { page, limit } }
    ).then(res => {
      // Handle paginated response format
      if (res.data && typeof res.data === 'object' && 'data' in res.data) {
        const paginatedData = res.data as unknown as PaginatedResponse<ActivityLog>;
        return {
          ...res,
          data: {
            logs: paginatedData.data,
            total: paginatedData.pagination.total,
            page: paginatedData.pagination.page,
            totalPages: paginatedData.pagination.pages
          }
        };
      }
      return res;
    }),
  // Paginated version
  getAllPaginated: (page?: number, limit?: number) => 
    api.get<PaginatedResponse<ActivityLog>>('/activity-log', { params: { page, limit } }),
};

// Database API
export const databaseAPI = {
  getOverview: () => api.get<DatabaseOverview>('/database/overview'),
  getFileMetadata: (filename: string) => api.get<FileMetadata>(`/database/file-metadata/${filename}`),
  getFile: (filename: string) => api.get<Property[] | Inquiry[] | User[] | CalendarEvent[] | ActivityLog[]>(`/database/file/${filename}`),
  getRecent: (type: 'properties' | 'inquiries' | 'agents') => api.get<Property[] | Inquiry[] | User[]>(`/database/recent/${type}`),
  clearNew: (type: 'properties' | 'inquiries' | 'agents', clearedBy: string) => 
    api.post(`/database/clear-new/${type}`, { clearedBy }),
  exportCSV: (filename: string) => api.get(`/database/export/${filename}/csv`, { responseType: 'blob' }),
  exportJSON: (filename: string) => api.get(`/database/export/${filename}/json`, { responseType: 'blob' }),
};

// Customer Authentication API
export const customerAuthAPI = {
  signup: (data: { name: string; email: string; phone?: string; password: string }) =>
    api.post('/customers/signup', data),
  login: (credentials: { email: string; password: string }) =>
    api.post('/customers/login', credentials),
  verifyEmail: (token: string) =>
    api.get(`/customers/verify-email/${token}`),
  resendVerification: (email: string) =>
    api.post('/customers/resend-verification', { email }),
  getProfile: (token: string) =>
    axios.get(`${API_URL}/customers/me`, {
      headers: { Authorization: `Bearer ${token}` }
    }),
  getAppointments: (token: string) =>
    axios.get(`${API_URL}/customers/appointments`, {
      headers: { Authorization: `Bearer ${token}` }
    }),
  updateProfile: (token: string, data: { name?: string; phone?: string }) =>
    axios.put(`${API_URL}/customers/me`, data, {
      headers: { Authorization: `Bearer ${token}` }
    }),
  
  // Phone Verification
  sendPhoneOTP: (token: string) =>
    axios.post(`${API_URL}/customers/send-phone-otp`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    }),
  verifyPhone: (token: string, otp: string) =>
    axios.post(`${API_URL}/customers/verify-phone`, { otp }, {
      headers: { Authorization: `Bearer ${token}` }
    }),
  resendPhoneOTP: (token: string) =>
    axios.post(`${API_URL}/customers/resend-phone-otp`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    }),
  cancelInquiry: (token: string, inquiryId: string, reason?: string) =>
    axios.post(`${API_URL}/customers/inquiries/${inquiryId}/cancel`, { reason }, {
      headers: { Authorization: `Bearer ${token}` }
    }),
  submitAppointmentFeedback: (token: string, appointmentId: string, payload: { rating: number; comment?: string }) =>
    axios.post(`${API_URL}/customers/appointments/${appointmentId}/feedback`, payload, {
      headers: { Authorization: `Bearer ${token}` }
    }),
  changePassword: (token: string, payload: { currentPassword: string; newPassword: string }) =>
    axios.put(`${API_URL}/customers/change-password`, payload, {
      headers: { Authorization: `Bearer ${token}` }
    }),
};

// Customer Favorites and Preferences
export const customerFeaturesAPI = {
  getFavorites: (token: string) =>
    axios.get(`${API_URL}/customers/favorites`, {
      headers: { Authorization: `Bearer ${token}` }
    }),
  addFavorite: (token: string, propertyId: string) =>
    axios.post(`${API_URL}/customers/favorites/${propertyId}`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    }),
  removeFavorite: (token: string, propertyId: string) =>
    axios.delete(`${API_URL}/customers/favorites/${propertyId}`, {
      headers: { Authorization: `Bearer ${token}` }
    }),
  getPreferences: (token: string) =>
    axios.get(`${API_URL}/customers/preferences`, {
      headers: { Authorization: `Bearer ${token}` }
    }),
  savePreferences: (token: string, payload: Record<string, unknown>) =>
    axios.put(`${API_URL}/customers/preferences`, payload, {
      headers: { Authorization: `Bearer ${token}` }
    })
};

// Notifications API
export const notificationsAPI = {
  getAll: () => api.get('/notifications'),
  getAllWithToken: (token: string) => axios.get(`${API_URL}/notifications`, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  markReadWithToken: (id: string, token: string) => axios.post(`${API_URL}/notifications/${id}/read`, {}, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  removeWithToken: (id: string, token: string) => axios.delete(`${API_URL}/notifications/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  clearAllWithToken: (token: string) => axios.delete(`${API_URL}/notifications`, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  markRead: (id: string) => api.post(`/notifications/${id}/read`),
  remove: (id: string) => api.delete(`/notifications/${id}`),
  clearAll: () => api.delete('/notifications')
};

// Commissions API
export const commissionsAPI = {
  getAll: () => api.get('/commissions'),
  getByAgent: (agentId: string) => api.get(`/commissions/agent/${agentId}`),
  getReport: (month: number, year: number) => api.get('/commissions/report', { params: { month, year } }),
  getSettings: () => api.get('/commissions/settings'),
  updateSettings: (defaultRate: number) => api.put('/commissions/settings', { defaultRate }),
  updatePropertyCommission: (propertyId: string, payload: { commissionRate?: number; markPaid?: boolean }) =>
    api.patch(`/commissions/property/${propertyId}`, payload)
};

// Property Documents API
export const documentsAPI = {
  listByProperty: (propertyId: string) => api.get(`/properties/${propertyId}/documents`),
  uploadToProperty: (propertyId: string, formData: FormData) =>
    api.post(`/properties/${propertyId}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  deleteFromProperty: (propertyId: string, docId: string) => api.delete(`/properties/${propertyId}/documents/${docId}`),
  download: (docId: string) => api.get(`/documents/${docId}/download`, { responseType: 'blob' }),
  listByPropertyWithToken: (propertyId: string, token: string) =>
    axios.get(`${API_URL}/properties/${propertyId}/documents`, { headers: { Authorization: `Bearer ${token}` } }),
  downloadWithToken: (docId: string, token: string) =>
    axios.get(`${API_URL}/documents/${docId}/download`, {
      responseType: 'blob',
      headers: { Authorization: `Bearer ${token}` }
    })
};

export const customerModerationAPI = {
  getFlags: (status: 'pending' | 'reviewed' | 'blocked' | 'dismissed' | 'all' = 'pending') =>
    api.get('/customer-flags', { params: { status } }),
  reviewFlag: (id: string, payload: { status: 'reviewed' | 'dismissed'; reviewNotes?: string }) =>
    api.post(`/customer-flags/${id}/review`, payload),
  blockFromFlag: (id: string, payload?: { blockReason?: string }) =>
    api.post(`/customer-flags/${id}/block`, payload || {}),
  removeCustomer: (customerId: string) => api.delete(`/customers/${customerId}/remove`)
};

export default api;
