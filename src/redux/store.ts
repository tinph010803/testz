import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slice/authSlice';
import userReducer from './slice/userSlice'; 
import chatReducer from './slice/chatSlice';
import postProfileReducer from './slice/postProfileSlice';
import followReducer from './slice/followSlice';
import callReducer from './slice/callSlice';
import incomingCallReducer from './slice/incomingCallSlice';
import likesReducer from './slice/likeSlice';
import notificationReducer from './slice/notificationSlice';
import commentsReducer from './slice/commentSilce';
export const store = configureStore({
  reducer: {
    auth: authReducer, 
    user: userReducer,
    chat: chatReducer,
    postProfile: postProfileReducer,
    follow: followReducer,
    call: callReducer,
    incomingCall: incomingCallReducer,
    likes: likesReducer,
    comments: commentsReducer,
    notification: notificationReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

