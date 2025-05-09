// redux/slice/followSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';

// const FOLLOW_API = 'http://localhost:3000/follow';
const FOLLOW_API = import.meta.env.VITE_API_URL + '/follow'

interface UserBasicInfo {
  _id: string;
  firstname: string;
  lastname: string;
  avatar?: string;
  username?: string;
}

interface FollowItem {
  _id: string;
  user: UserBasicInfo; 
  createdAt?: string;
  updatedAt?: string;
}

interface FollowState {
  followers: FollowItem[];
  followings: FollowItem[];
  authFollowings: FollowItem[];
  loading: boolean;
  error: string | null;
  successMessage: string | null;
}

interface FollowPayload {
  followingId: string;
  followerId: string;
}

const initialState: FollowState = {
  followers: [],
  followings: [],
  authFollowings: [],
  loading: false,
  error: null,
  successMessage: null,
};

export const followUser = createAsyncThunk<string, FollowPayload, { rejectValue: string }>(
  'follow/followUser',
  async ({ followingId, followerId }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${FOLLOW_API}`,
        { followingId },
        { headers: { 'x-user-id': followerId } }
      );
      return response.data.message; // ✅ kiểu string
    } catch {
      return rejectWithValue('Failed to follow user');
    }
  }
);

export const unfollowUser = createAsyncThunk<string, FollowPayload, { rejectValue: string }>(
  'follow/unfollowUser',
  async ({ followingId, followerId }, { rejectWithValue, dispatch }) => {
    try {
      // Gửi yêu cầu unfollow
      const response = await axios.post(
        `${FOLLOW_API}/unfollow`, 
        { followingId },
        {
          headers: { 'x-user-id': followerId }, 
        }
      );

      dispatch(getFollowers(followerId)); 
      dispatch(getFollowings(followerId)); 

      return response.data.message; 
    } catch (error) {
      return rejectWithValue(
        axios.isAxiosError(error) && error.response?.data?.message
          ? error.response.data.message 
          : 'Unfollow failed' 
      );
    }
  }
);

// Get followers
export const getFollowers = createAsyncThunk(
  'follow/getFollowers',
  async (userId: string, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${FOLLOW_API}/followers/${userId}`);
      // Kiểm tra dữ liệu trả về
      if (!response.data.data || response.data.data.length === 0) {
        return [];
      }
      return response.data.data;
    } catch {
      return rejectWithValue('Failed to fetch followers');
    }
  }
);

// Redux slice - Thêm logic vào để gọi API lấy followings
export const getFollowings = createAsyncThunk(
  'follow/getFollowings',
  async (userId: string, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${FOLLOW_API}/followings/${userId}`);
      if (!response.data.data || response.data.data.length === 0) {
        return [];
      }

      return response.data.data;
    } catch {
      return rejectWithValue('Failed to fetch followings');
    }
  }
);

export const getFollowingsByUserId = createAsyncThunk(
  'follow/getFollowingsByUserId',
  async (userId: string) => {
    const response = await axios.get(`${FOLLOW_API}/followings/${userId}`);
    return response.data.data; 
  }
);

const followSlice = createSlice({
  name: 'follow',
  initialState,
  reducers: {
    resetFollowState: (state) => {
      state.loading = false;
      state.error = null;
      state.successMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Follow user
      .addCase(followUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(followUser.fulfilled, (state, action: PayloadAction<string>) => {
        state.loading = false;
        state.successMessage = action.payload;
      })
      .addCase(followUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Unfollow user
      .addCase(unfollowUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(unfollowUser.fulfilled, (state, action: PayloadAction<string>) => {
        state.loading = false;
        state.successMessage = action.payload;
      })
      .addCase(unfollowUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Get followers
      .addCase(getFollowers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getFollowers.fulfilled, (state, action: PayloadAction<FollowItem[]>) => {
        state.loading = false;
        state.followers = action.payload;
      })
      .addCase(getFollowers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Get followings
      .addCase(getFollowings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getFollowings.fulfilled, (state, action: PayloadAction<FollowItem[]>) => {
        state.loading = false;
        state.followings = action.payload;
      })
      .addCase(getFollowings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { resetFollowState } = followSlice.actions;
export type { FollowItem };
export default followSlice.reducer;
