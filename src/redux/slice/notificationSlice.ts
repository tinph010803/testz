import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { RootState } from '../store';

const API_BASE_URL = import.meta.env.VITE_API_URL + '/noti';

export interface Notification {
  _id: string;
  type: "message" | "like" | "comment" | "follow";
  receiverId: string;
  senderId: string;
  messageContent?: string;
  chatId?: string;
  postId?: string;
  commentContent?: string;
  isRead: boolean;
  createdAt: string;
}

interface NotificationState {
  notifications: Notification[];
  loading: boolean;
  error: string | null;
  unreadCount: number; // Đếm số lượng thông báo chưa đọc
}

// xin chào bạn 

const initialState: NotificationState = {
  notifications: [],
  loading: false,
  error: null,
  unreadCount: 0, 
};

// ✅ Lấy danh sách thông báo gần nhất
export const fetchRecentNotifications = createAsyncThunk(
  "notification/fetchRecentNotifications",
  async (_, thunkAPI) => {
    try {
      const state = thunkAPI.getState() as RootState;
      const userId = state.auth.user?._id;

      if (!userId) {
        throw new Error("Missing userId from Redux");
      }

      const linkapi = `http://localhost:3000/noti/all?userId=${userId}`;
      const response = await axios.get(linkapi);
      return response.data;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message || "Failed to fetch notifications"
      );
    }
  }
);

// ✅ Đánh dấu 1 thông báo là đã đọc
export const markNotificationAsRead = createAsyncThunk(
  "notification/markAsRead",
  async ({ id, userId }: { id: string; userId: string }, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`${API_BASE_URL}/markOne/${id}`, { userId });
      return response.data.notification;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue(error.response?.data?.message || error.message);
      }
      return rejectWithValue("An unknown error occurred");
    }
  }
);

// ✅ Đánh dấu nhiều thông báo là đã đọc
export const markMultipleNotificationsAsRead = createAsyncThunk(
  "notification/markManyAsRead",
  async ({ ids, userId }: { ids: string[]; userId: string }, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`${API_BASE_URL}/markMany`, { ids, userId });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue(error.response?.data?.message || error.message);
      }
      return rejectWithValue("An unknown error occurred");
    }
  }
);

// ✅ Tạo thông báo "follow" khi người dùng theo dõi
export const createNotification = createAsyncThunk(
  "notification/createNotification",
  async (payload: {
    type: "like" | "follow" | "comment" | "message";
    senderId: string;
    receiverId: string;
    messageContent?: string;
    postId?: string;
    commentContent?: string;
    createdAt: string;
  }, { rejectWithValue }) => {
    try {
      // Gửi request lên backend để tạo thông báo
      const response = await axios.post(`${API_BASE_URL}/create`, {
        type: payload.type,
        senderId: payload.senderId,
        receiverId: payload.receiverId,
        messageContent: payload.messageContent,
        postId: payload.postId,
        commentContent: payload.commentContent,
        createdAt: payload.createdAt,
      });

      // // Cập nhật số lượng thông báo chưa đọc trong Redux store
      // dispatch(incrementUnreadCount());

      return response.data.notification;  // Trả về thông báo đã được tạo từ backend
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);



// Action để tăng số lượng thông báo chưa đọc
export const incrementUnreadCount = createAsyncThunk(
  'notification/incrementUnreadCount',
  async (_, { getState, dispatch }) => {
    const state = getState() as RootState;
    dispatch(setUnreadCount(state.notification.unreadCount + 1)); // Tăng số lượng thông báo chưa đọc lên 1
  }
);

// ✅ Lấy số lượng thông báo chưa đọc
export const fetchUnreadCount = createAsyncThunk(
  "notification/fetchUnreadCount",
  async (_, thunkAPI) => {
    try {
      const state = thunkAPI.getState() as RootState;
      const userId = state.auth.user?._id;

      if (!userId) {
        throw new Error("Missing userId from Redux");
      }

      const linkapi = `http://localhost:3000/noti/all?userId=${userId}`;
      console.log("linkapi:",linkapi);
      const response = await axios.get(linkapi);
      console.log("data:",response.data);
      // Lọc các thông báo chưa đọc
      const unreadNotifications = response.data.filter((notification: Notification) => !notification.isRead);
      
      return unreadNotifications.length; // Trả về số lượng thông báo chưa đọc
    } catch (error: any) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message || "Failed to fetch unread count"
      );
    }
  }
);


// Cập nhật số lượng thông báo chưa đọc
const notificationSlice = createSlice({
  name: "notification",
  initialState,
  reducers: {
    setUnreadCount(state, action) {
      state.unreadCount = action.payload; // Cập nhật số lượng thông báo chưa đọc
    },
    clearNotifications(state) {
      state.notifications = [];
    },
    markOneAsRead(state, action) {
      const id = action.payload;
      const target = state.notifications.find(n => n._id === id);
      if (target) target.isRead = true;
    },
    markManyAsRead(state, action) {
      const ids: string[] = action.payload;
      state.notifications = state.notifications.map(n =>
        ids.includes(n._id) ? { ...n, isRead: true } : n
      );
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRecentNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRecentNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.notifications = action.payload;
      })
      .addCase(fetchRecentNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(markNotificationAsRead.fulfilled, (state, action) => {
        const updated = action.payload;
        const target = state.notifications.find(n => n._id === updated._id);
        if (target) target.isRead = true;
      })
      .addCase(fetchUnreadCount.fulfilled, (state, action) => {
        state.unreadCount = action.payload; // Cập nhật số lượng thông báo chưa đọc
      })
      .addCase(markMultipleNotificationsAsRead.fulfilled, (state, action) => {
        const { ids } = action.meta.arg;
        state.notifications.forEach(n => {
          if (ids.includes(n._id)) {
            n.isRead = true;
          }
        });
      })
      .addCase(createNotification.fulfilled, (state, action) => {
        console.log("Follow notification sent successfully:", state);
        console.log("Follow notification sent successfully:", action.payload);
      });
  },
});

export const { setUnreadCount, clearNotifications, markOneAsRead, markManyAsRead } = notificationSlice.actions;

export default notificationSlice.reducer;
