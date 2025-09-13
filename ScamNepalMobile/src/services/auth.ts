import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, LoginCredentials, RegisterData } from '../../types';
import { apiService } from './api';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<boolean>;
  register: (userData: RegisterData) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
  updateUser: (user: User) => void;
}

class AuthService {
  private listeners: ((state: AuthState) => void)[] = [];
  private state: AuthState = {
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  };

  constructor() {
    this.initializeAuth();
  }

  private async initializeAuth() {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      const userData = await AsyncStorage.getItem('user_data');
      
      if (token && userData) {
        const user = JSON.parse(userData);
        this.setState({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        this.setState({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      this.setState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  }

  private setState(newState: Partial<AuthState>) {
    this.state = { ...this.state, ...newState };
    this.notifyListeners();
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.state));
  }

  subscribe(listener: (state: AuthState) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  getState(): AuthState {
    return this.state;
  }

  async login(credentials: LoginCredentials): Promise<boolean> {
    try {
      this.setState({ isLoading: true });
      const response = await apiService.login(credentials);
      
      if (response.success && response.data) {
        this.setState({
          user: response.data.user,
          token: response.data.token,
          isAuthenticated: true,
          isLoading: false,
        });
        return true;
      } else {
        this.setState({ isLoading: false });
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      this.setState({ isLoading: false });
      return false;
    }
  }

  async register(userData: RegisterData): Promise<boolean> {
    try {
      this.setState({ isLoading: true });
      const response = await apiService.register(userData);
      
      if (response.success && response.data) {
        this.setState({
          user: response.data.user,
          token: response.data.token,
          isAuthenticated: true,
          isLoading: false,
        });
        return true;
      } else {
        this.setState({ isLoading: false });
        return false;
      }
    } catch (error) {
      console.error('Registration error:', error);
      this.setState({ isLoading: false });
      return false;
    }
  }

  async logout(): Promise<void> {
    try {
      await apiService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.setState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  }

  async checkAuthStatus(): Promise<void> {
    try {
      const response = await apiService.getProfile();
      if (response.success && response.data) {
        this.setState({ user: response.data });
        await AsyncStorage.setItem('user_data', JSON.stringify(response.data));
      } else {
        await this.logout();
      }
    } catch (error) {
      console.error('Auth check error:', error);
      await this.logout();
    }
  }

  updateUser(user: User): void {
    this.setState({ user });
    AsyncStorage.setItem('user_data', JSON.stringify(user));
  }

  isAdmin(): boolean {
    return this.state.user?.role === 'admin';
  }

  isModerator(): boolean {
    return this.state.user?.role === 'moderator' || this.state.user?.role === 'admin';
  }

  isMember(): boolean {
    return this.state.user?.role === 'member';
  }
}

export const authService = new AuthService();
export default authService;
