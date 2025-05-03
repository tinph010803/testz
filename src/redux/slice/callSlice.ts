// redux/slice/callSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface CallState {
  isOngoing: boolean;
  isVisible: boolean;
  isCalling: boolean;
  isVideo: boolean;
  calleeName: string;
  calleeAvatar: string;
  rejectedByCallee: boolean;
  toUserId: string;
  fromUserId: string;
  fromName: string;
  fromAvatar: string;
  isGroup: boolean;
  groupName: string;
  localStream: MediaStream | null;
}

const initialState: CallState = {
  isVisible: false,
  isCalling: false,
  isVideo: false,
  calleeName: '',
  calleeAvatar: '',
  rejectedByCallee: false,
  toUserId: '',
  fromUserId: '',
  fromName: '',
  fromAvatar: '',
  isGroup: false,
  groupName: '',
  isOngoing: false, // Thêm thuộc tính này để theo dõi trạng thái cuộc gọi;
  localStream: null, // Thêm thuộc tính này để lưu trữ stream video/audio
};

const callSlice = createSlice({
  name: 'call',
  initialState,
  reducers: {
    startCall: (
      state,
      action: PayloadAction<{
        isVideo: boolean;
        calleeName: string;
        calleeAvatar?: string;
        toUserId?: string;
        fromUserId?: string;
        fromName?: string;
        fromAvatar?: string;
        isGroup?: boolean;
        groupName?: string;
      }>
    ) => {
      state.isVisible = true;
      state.isCalling = true;
      state.isVideo = action.payload.isVideo;
      state.calleeName = action.payload.calleeName;
      state.calleeAvatar = action.payload.calleeAvatar ?? '';

      // ✅ Reset trạng thái từ chối cũ
      state.rejectedByCallee = false;

      // ✅ Lưu lại thông tin để gọi lại
      state.toUserId = action.payload.toUserId ?? '';
      state.fromUserId = action.payload.fromUserId ?? '';
      state.fromName = action.payload.fromName ?? '';
      state.fromAvatar = action.payload.fromAvatar ?? '';
      state.isGroup = action.payload.isGroup ?? false;
      state.groupName = action.payload.groupName ?? '';
    },
    acceptedCall: (state) => {
      state.isOngoing = true;
      state.isCalling = false;
      state.isVisible = true;
    },

    endCall: (state) => {
      state.isCalling = false;
      state.isVisible = false;
      state.isOngoing = false;
      state.calleeName = '';
      state.calleeAvatar = '';
      state.rejectedByCallee = false;
      state.toUserId = '';
      state.fromUserId = '';
      state.fromName = '';
      state.fromAvatar = '';
      state.isGroup = false;
      state.groupName = '';
    },
    closeCall: (state) => {
      state.isVisible = false;
      state.isCalling = false;
      state.calleeName = '';
      state.isOngoing = false;
    },
    rejectedCall: (state) => {
      state.rejectedByCallee = true;
      state.isCalling = false;
    },
  
    clearLocalStream: (state) => {
      state.localStream = null;
    },
    
  },
});

export const { startCall, endCall, closeCall, rejectedCall, acceptedCall,clearLocalStream} = callSlice.actions;
export default callSlice.reducer;
