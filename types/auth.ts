export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    uid: string;
    phone: string;
  };
  error?: string;
}

export interface UserPhone {
  uid: string;
  phone: string;
  industry?: {
    primary: string;
    secondary: string;
  };
}

export interface LoginRequest {
  phone: string;
}

export interface LoginState {
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}