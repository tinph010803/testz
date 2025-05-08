// src/redux/slices/authSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { RootState } from '../store';

// const URI_API = 'http://localhost:3000/auth';
const URI_API = import.meta.env.VITE_API_URL + '/auth';

// Define the type for the auth state
interface AuthState {
  user: { _id: string, username: string, googleId?: string } | null;
  token: string | null; // Lưu token từ localStorage
  loading: boolean;
  error: string | null;
  checkStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  checkMessage: string | null;
  resetStatus?: 'idle' | 'loading' | 'succeeded' | 'failed';
  resetMessage?: string | null;
  userDetail?: UserDetail | null;
  phoneNumber?: string | null;
}


// Define the initial state
const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('token') || '', // Lưu token từ localStorage
  loading: false,
  error: null,
  checkStatus: 'idle',
  checkMessage: null,
  resetStatus: 'idle',
  resetMessage: null,
  userDetail: null,

};

// Define the type for user login data
interface LoginData {
  username: string;
  password: string;
}

interface RegisterData {
  phoneNumber: string;
  username: string;
  password: string;
}

interface CheckUserExistsData {
  phoneNumber?: string;
  username?: string;
}
interface CheckEmailOrPhoneData {
  email?: string;
  phoneNumber?: string;
}
interface ResetPasswordPayload {
  token: string;
  password: string;
}
interface SendResetEmailPayload {
  email: string;
}

interface ResetPasswordWithPhonePayload {
  phoneNumber: string;
  password: string;
}
interface UserDetail {
  _id: string;
  userId: string;
  username: string;
  firstname: string;
  lastname: string;
  DOB: string;
  gender: string;
  phoneNumber: string;
  email: string;
  address: string;
  bio: string;
  avatar: string;
  backgroundAvatar: string;
}
interface ChangePasswordPayload {
  oldPassword: string;
  newPassword: string;
}

// Tạo thunk cho đăng nhập
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (userData: LoginData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${URI_API}/login`, userData, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      // Kiểm tra phản hồi trả về từ backend
      if (response.data && response.data.token && response.data.user) {
        console.log("Token đăng nhập thành công: ", response.data.token);
        console.log("User đăng nhập thành công: ", response.data.user);


        return {
          user: { _id: response.data.user._id, username: response.data.user.username },   // Lưu thông tin user
          token: response.data.token,   // Lưu token
        };
      } else {
        return rejectWithValue('Token hoặc user không được trả về từ server');
      }
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Something went wrong');
    }
  }
);

export const registerUserWithPhone = createAsyncThunk(
  'auth/registerUserWithPhone',
  async (userData: RegisterData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${URI_API}/register/phone`, userData, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response.data; // Assuming the response contains { token, user }
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Registration failed');
    }
  }
);

export const loginWithGoogleRegister = createAsyncThunk(
  'auth/loginWithGoogleRegister',
  async (googleUserInfo: { email: string, googleId: string }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${URI_API}/register/google`, googleUserInfo, {
        headers: { 'Content-Type': 'application/json' },
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status || 500;
        const message = error.response?.data?.message || 'Google sign in failed';
        return rejectWithValue({ message, status });
      }
      return rejectWithValue({ message: 'Unknown error occurred', status: 500 });
    }
  }
);


export const loginWithGoogle = createAsyncThunk(
  'auth/loginWithGoogle',
  async (googleUserInfo: { email: string, googleId: string }, { rejectWithValue }) => {
    try {
      const res = await axios.post(`${URI_API}/login/google`, googleUserInfo);
      return res.data;
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        return rejectWithValue(error.response.data.message);
      }
      return rejectWithValue('Google login failed');
    }
  }
);

export const checkUserExists = createAsyncThunk(
  'auth/checkUserExists',
  async (data: CheckUserExistsData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${URI_API}/check-user`, data, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response.data; // Trả về message
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        return rejectWithValue(error.response.data.message);
      }
      return rejectWithValue('Phone number or Username already in use');
    }
  }
);
export const checkEmailOrPhoneExists = createAsyncThunk(
  'auth/checkEmailOrPhoneExists',
  async (data: CheckEmailOrPhoneData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${URI_API}/check-email-phone`, data, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response.data; // Trả về { message: 'Account exists' }
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        return rejectWithValue(error.response.data.message);
      }
      return rejectWithValue('Phone number or Email not found');
    }
  }
);

export const sendResetPasswordToEmail = createAsyncThunk(
  'auth/sendResetPasswordToEmail',
  async (data: SendResetEmailPayload, { rejectWithValue }) => {
    try {
      const res = await axios.post(`${URI_API}/send-reset-email`, data);
      return res.data;
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        return rejectWithValue(err.response.data.message);
      }
      return rejectWithValue('Failed to send reset email');
    }
  }
);

export const resetPasswordWithToken = createAsyncThunk(
  'auth/resetPasswordWithToken',
  async (data: ResetPasswordPayload, { rejectWithValue }) => {
    try {
      const res = await axios.post(`${URI_API}/reset-password`, data);
      return res.data;
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        return rejectWithValue(err.response.data.message);
      }
      return rejectWithValue('Failed to reset password');
    }
  }
);

export const resetPasswordWithPhone = createAsyncThunk(
  'auth/resetPasswordWithPhone',
  async (data: ResetPasswordWithPhonePayload, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${URI_API}/reset-password-phone`, data, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response.data; // { message: "Password has been reset successfully via phone" }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        return rejectWithValue(error.response.data.message);
      }
      return rejectWithValue("Failed to reset password via phone");
    }
  }
);
export const getUserProfile = createAsyncThunk(
  'auth/getUserProfile',
  async (token: string, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${URI_API}/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return res.data;
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        return rejectWithValue(err.response.data.message);
      }
    }
  }
);
export const sendEmailOtp = createAsyncThunk(
  'auth/sendEmailOtp',
  async (data: { email: string }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${URI_API}/send-email-otp`, data);
      return response.data;
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        return rejectWithValue(err.response.data.message);
      }
      return rejectWithValue('Email is already in use');
    }
  }
);
export const verifyEmailOtp = createAsyncThunk(
  'auth/verifyEmailOtp',
  async (data: { email: string; otp: string }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${URI_API}/verify-email-otp`, data);
      return response.data;
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        return rejectWithValue(err.response.data.message);
      }
      return rejectWithValue('Failed to verify OTP');
    }
  }
);
export const changePassword = createAsyncThunk(
  'auth/changePassword',
  async (data: ChangePasswordPayload, { getState, rejectWithValue }) => {
    const state = getState() as RootState;
    const token = state.auth.token;

    try {
      const response = await axios.post(
        `${URI_API}/change-password`,
        data,
        {
          headers: {
            Authorization: `${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data; // { message: 'Password changed successfully' }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        return rejectWithValue(error.response.data.message);
      }
      return rejectWithValue('Cannot change password. Old password is incorrect.');
    }
  }
);
export const getPhoneNumber = createAsyncThunk(
  'auth/getPhoneNumber',
  async (_, { getState, rejectWithValue }) => {
    const state = getState() as RootState;
    const token = state.auth.token;
    
    try {
      const response = await axios.get(`${URI_API}/phone`, {
        headers: {
          Authorization: `${token}`,
        },
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        return rejectWithValue(error.response.data.message);
      }
      return rejectWithValue('Failed to fetch phone number');
    }
  }
);

// Tạo slice cho auth
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.userDetail = null;
      state.error = null;
      localStorage.removeItem("token");
    }
    ,
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action: PayloadAction<{ user: { _id: string, username: string }, token: string }>) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        localStorage.setItem('token', action.payload.token);
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(registerUserWithPhone.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUserWithPhone.fulfilled, (state, action: PayloadAction<{ user: { _id: string, username: string }, token: string }>) => {
        state.loading = false;
        state.user = action.payload.user;;  // Save user and token
        console.log("Token đăng ký thành công: ", action.payload.token);
        state.token = action.payload.token;
        localStorage.setItem("token", action.payload.token);

      })
      .addCase(registerUserWithPhone.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(loginWithGoogleRegister.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginWithGoogleRegister.fulfilled, (state, action: PayloadAction<{ user: { _id: string, username: string }, token: string }>) => {
        state.loading = false;
        state.user = action.payload.user;  // Save user and token
        state.token = action.payload.token;
        console.log("Token đăng ký bằng Google: ", action.payload.token);
      })
      .addCase(loginWithGoogleRegister.rejected, (state, action) => {
        state.loading = false;
        if (typeof action.payload === "string") {
          state.error = action.payload;
        } else if (action.payload && typeof action.payload === "object") {
          const payload = action.payload as { message?: string };
          state.error = payload.message || "Đăng ký thất bại";
        }
      })
      
      .addCase(checkUserExists.pending, (state) => {
        state.checkStatus = 'loading';
        state.checkMessage = null;
      })
      .addCase(checkUserExists.fulfilled, (state, action: PayloadAction<{ message: string }>) => {
        state.checkStatus = 'succeeded';
        state.checkMessage = action.payload.message;
      })
      .addCase(checkUserExists.rejected, (state, action) => {
        state.checkStatus = 'failed';
        state.checkMessage = action.payload as string;
      })
      .addCase(checkEmailOrPhoneExists.pending, (state) => {
        state.checkStatus = 'loading';
        state.checkMessage = null;
      })
      .addCase(checkEmailOrPhoneExists.fulfilled, (state, action: PayloadAction<{ message: string }>) => {
        state.checkStatus = 'succeeded';
        state.checkMessage = action.payload.message;
      })
      .addCase(checkEmailOrPhoneExists.rejected, (state, action) => {
        state.checkStatus = 'failed';
        state.checkMessage = action.payload as string;
      })
      // Gửi email reset password
      .addCase(sendResetPasswordToEmail.pending, (state) => {
        state.resetStatus = 'loading';
        state.resetMessage = null;
      })
      .addCase(sendResetPasswordToEmail.fulfilled, (state, action: PayloadAction<{ message: string }>) => {
        state.resetStatus = 'succeeded';
        state.resetMessage = action.payload.message;
      })
      .addCase(sendResetPasswordToEmail.rejected, (state, action) => {
        state.resetStatus = 'failed';
        state.resetMessage = action.payload as string;
      })

      // Reset password với token
      .addCase(resetPasswordWithToken.pending, (state) => {
        state.resetStatus = 'loading';
        state.resetMessage = null;
      })
      .addCase(resetPasswordWithToken.fulfilled, (state, action: PayloadAction<{ message: string }>) => {
        state.resetStatus = 'succeeded';
        state.resetMessage = action.payload.message;
      })
      .addCase(resetPasswordWithToken.rejected, (state, action) => {
        state.resetStatus = 'failed';
        state.resetMessage = action.payload as string;
      })
      // Reset password bằng số điện thoại
      .addCase(resetPasswordWithPhone.pending, (state) => {
        state.resetStatus = 'loading';
        state.resetMessage = null;
      })
      .addCase(resetPasswordWithPhone.fulfilled, (state, action: PayloadAction<{ message: string }>) => {
        state.resetStatus = 'succeeded';
        state.resetMessage = action.payload.message;
      })
      .addCase(resetPasswordWithPhone.rejected, (state, action) => {
        state.resetStatus = 'failed';
        state.resetMessage = action.payload as string;
      })
      .addCase(getUserProfile.fulfilled, (state, action: PayloadAction<{ user: { _id: string, username: string }, userDetail: UserDetail, token?: string }>) => {
        state.user = { ...action.payload.user };
        state.token = action.payload.token || state.token; // Lưu token nếu có
        state.userDetail = action.payload.userDetail;
      })
      .addCase(getUserProfile.rejected, (state, action) => {
        state.error = action.payload as string;

      })
      // Gửi OTP qua email
      .addCase(sendEmailOtp.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sendEmailOtp.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(sendEmailOtp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Xác minh OTP email
      .addCase(verifyEmailOtp.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyEmailOtp.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(verifyEmailOtp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(loginWithGoogle.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginWithGoogle.fulfilled, (state, action: PayloadAction<{ user: { _id: string, username: string }, token: string }>) => {
        state.loading = false;
        state.user = action.payload.user;  // Save user and token
        state.token = action.payload.token;
        localStorage.setItem("token", action.payload.token);
      })
      .addCase(loginWithGoogle.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(changePassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(changePassword.fulfilled, (state, action: PayloadAction<{ message: string }>) => {
        state.loading = false;
        state.resetMessage = action.payload.message;
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(getPhoneNumber.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getPhoneNumber.fulfilled, (state, action: PayloadAction<{ phoneNumber: string }>) => {
        state.loading = false;
        state.phoneNumber = action.payload.phoneNumber;
      })
      .addCase(getPhoneNumber.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

  },
});

export const { logout } = authSlice.actions;

export default authSlice.reducer;