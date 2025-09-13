import axios, { AxiosInstance, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  ApiResponse, 
  AuthResponse, 
  LoginCredentials, 
  RegisterData, 
  User, 
  Report, 
  Entity, 
  SearchFilters, 
  SearchResult,
  PaginatedResponse 
} from '../../types';

class ApiService {
  private api: AxiosInstance;
  private baseURL: string;

  constructor() {
    this.baseURL = __DEV__ 
      ? 'http://localhost:3001/api' 
      : 'https://scamnepal-backend.onrender.com/api';
    
    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  // Method to set auth token programmatically
  async setAuthToken(token: string): Promise<void> {
    await AsyncStorage.setItem('auth_token', token);
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          await AsyncStorage.removeItem('auth_token');
          await AsyncStorage.removeItem('user_data');
          // Navigate to login screen
        }
        return Promise.reject(error);
      }
    );
  }

  // Authentication Methods
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response: AxiosResponse<AuthResponse> = await this.api.post('/auth/login', credentials);
    if (response.data.success && response.data.data) {
      await AsyncStorage.setItem('auth_token', response.data.data.token);
      await AsyncStorage.setItem('user_data', JSON.stringify(response.data.data.user));
    }
    return response.data;
  }

  async register(userData: RegisterData): Promise<AuthResponse> {
    const response: AxiosResponse<AuthResponse> = await this.api.post('/auth/register', userData);
    if (response.data.success && response.data.data) {
      await AsyncStorage.setItem('auth_token', response.data.data.token);
      await AsyncStorage.setItem('user_data', JSON.stringify(response.data.data.user));
    }
    return response.data;
  }

  async logout(): Promise<void> {
    try {
      await this.api.post('/auth/logout');
    } finally {
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('user_data');
    }
  }

  async getProfile(): Promise<ApiResponse<User>> {
    const response: AxiosResponse<ApiResponse<User>> = await this.api.get('/auth/profile');
    return response.data;
  }

  async updateProfile(userData: Partial<User>): Promise<ApiResponse<User>> {
    const response: AxiosResponse<ApiResponse<User>> = await this.api.patch('/auth/profile', userData);
    return response.data;
  }

  // Report Methods
  async getReports(page: number = 1, limit: number = 20): Promise<ApiResponse<PaginatedResponse<Report>>> {
    const response: AxiosResponse<ApiResponse<PaginatedResponse<Report>>> = await this.api.get('/reports', {
      params: { page, limit }
    });
    return response.data;
  }

  async getReport(id: string): Promise<ApiResponse<Report>> {
    const response: AxiosResponse<ApiResponse<Report>> = await this.api.get(`/reports/${id}`);
    return response.data;
  }

  async createReport(reportData: Partial<Report>): Promise<ApiResponse<Report>> {
    const response: AxiosResponse<ApiResponse<Report>> = await this.api.post('/reports', reportData);
    return response.data;
  }

  async updateReport(id: string, reportData: Partial<Report>): Promise<ApiResponse<Report>> {
    const response: AxiosResponse<ApiResponse<Report>> = await this.api.patch(`/reports/${id}`, reportData);
    return response.data;
  }

  async deleteReport(id: string): Promise<ApiResponse<{ message: string }>> {
    const response: AxiosResponse<ApiResponse<{ message: string }>> = await this.api.delete(`/reports/${id}`);
    return response.data;
  }

  // Search Methods
  async search(filters: SearchFilters, page: number = 1, limit: number = 20): Promise<ApiResponse<PaginatedResponse<SearchResult>>> {
    const response: AxiosResponse<ApiResponse<PaginatedResponse<SearchResult>>> = await this.api.get('/search', {
      params: { ...filters, page, limit }
    });
    return response.data;
  }

  async getSearchSuggestions(query: string): Promise<ApiResponse<string[]>> {
    const response: AxiosResponse<ApiResponse<string[]>> = await this.api.get('/search/autocomplete', {
      params: { q: query }
    });
    return response.data;
  }

  // Entity Methods
  async getEntities(page: number = 1, limit: number = 20, filters?: any): Promise<ApiResponse<PaginatedResponse<Entity>>> {
    const response: AxiosResponse<ApiResponse<PaginatedResponse<Entity>>> = await this.api.get('/entities', {
      params: { page, limit, ...filters }
    });
    return response.data;
  }

  async getEntity(id: string): Promise<ApiResponse<Entity>> {
    const response: AxiosResponse<ApiResponse<Entity>> = await this.api.get(`/entities/${id}`);
    return response.data;
  }

  // Admin Methods
  async getUsers(page: number = 1, limit: number = 20): Promise<ApiResponse<PaginatedResponse<User>>> {
    const response: AxiosResponse<ApiResponse<PaginatedResponse<User>>> = await this.api.get('/admin/users', {
      params: { page, limit }
    });
    return response.data;
  }

  async createUser(userData: RegisterData): Promise<ApiResponse<User>> {
    const response: AxiosResponse<ApiResponse<User>> = await this.api.post('/auth/register', userData);
    return response.data;
  }

  async updateUserRole(id: string, role: string): Promise<ApiResponse<User>> {
    const response: AxiosResponse<ApiResponse<User>> = await this.api.patch(`/auth/users/${id}/role`, { role });
    return response.data;
  }

  async getModerationQueue(page: number = 1, limit: number = 20): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.get('/moderation/queue', {
      params: { page, limit }
    });
    return response.data;
  }

  // File Upload Methods
  async uploadEvidence(reportId: string, files: any[]): Promise<ApiResponse<any>> {
    const formData = new FormData();
    files.forEach((file, index) => {
      formData.append('files', {
        uri: file.uri,
        type: file.type,
        name: file.name,
      } as any);
    });

    const response: AxiosResponse<ApiResponse<any>> = await this.api.post(
      `/reports/${reportId}/evidence`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  }

  // Health Check
  async healthCheck(): Promise<ApiResponse<{ status: string; timestamp: string }>> {
    const response: AxiosResponse<ApiResponse<{ status: string; timestamp: string }>> = await this.api.get('/health');
    return response.data;
  }
}

export const apiService = new ApiService();
export default apiService;
