// src/redux/slices/postProfileSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

const URI_API = import.meta.env.VITE_API_URL + '/posts';
interface Post {
  _id: string;
  content: string;
  media?: string[];
  tags?: string[];
  userId: string;
  createdAt: string;
  username: string;
  avatar: string;   
}

interface PostState {
  posts: Post[];
  count: number;
  loading: boolean;
  error: string | null;
}

const initialState: PostState = {
  posts: [],
  count: 0,
  loading: false,
  error: null,
};

export const fetchUserPosts = createAsyncThunk(
  "postProfile/fetchUserPosts",
  async (userId: string, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${URI_API}/user/posts?userId=${userId}`);
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const createPost = createAsyncThunk(
  "postProfile/createPost",
  async (
    data: { content: string; media?: string[]; tags?: string[] },
    { getState, rejectWithValue }
  ) => {
    try {
      const state: any = getState();
      const token = state.auth.token;
      const res = await axios.post(
        `${URI_API}`,
        data,
        {
          headers: {
            Authorization: `${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const deletePost = createAsyncThunk(
  "postProfile/deletePost",
  async (postId: string, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${URI_API}/${postId}`, {
        headers: {
          Authorization: `${token}`,
        },
      });
      return { postId };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const fetchAllPosts = createAsyncThunk(
  "postProfile/fetchAllPosts",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${URI_API}`); // GET /posts
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);
export const editPost = createAsyncThunk(
  "postProfile/editPost",
  async (
    data: { postId: string; content?: string; media?: string[] },
    { getState, rejectWithValue }
  ) => {
    try {
      const state: any = getState();
      const token = state.auth.token;
      const { postId, ...updateData } = data;

      const res = await axios.put(
        `${URI_API}/${postId}`,
        updateData,
        {
          headers: {
            Authorization: `${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      return res.data.post; // return post mới sau khi edit
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);


const postProfileSlice = createSlice({
  name: "postProfile",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserPosts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserPosts.fulfilled, (state, action: PayloadAction<Post[]>) => {
        state.loading = false;
        state.posts = action.payload;
        state.count = action.payload.length;
      })
      .addCase(fetchUserPosts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createPost.fulfilled, (state, action: PayloadAction<Post>) => {
        state.posts.unshift(action.payload);
        state.count += 1;
      })
      .addCase(deletePost.fulfilled, (state, action: PayloadAction<{ postId: string }>) => {
        state.posts = state.posts.filter(post => post._id !== action.payload.postId);
        state.count = state.posts.length;
      })
      .addCase(fetchAllPosts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllPosts.fulfilled, (state, action: PayloadAction<Post[]>) => {
        state.loading = false;
        state.posts = action.payload;
        state.count = action.payload.length;
      })
      .addCase(fetchAllPosts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(editPost.fulfilled, (state, action: PayloadAction<Post>) => {
        const index = state.posts.findIndex(post => post._id === action.payload._id);
        if (index !== -1) {
          state.posts[index] = action.payload; // Cập nhật lại bài post đã chỉnh sửa
        }
      })
;      
  },
});

export default postProfileSlice.reducer;
