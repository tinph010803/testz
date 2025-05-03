import { createSlice, PayloadAction } from '@reduxjs/toolkit';
type IncomingCallState = {
  visible: boolean;
  fromUserId: string;
  fromName: string;
  fromAvatar: string;
  isVideo: boolean;
  isGroup?: boolean;
  groupName?: string;
  groupAvatar?: string;
};

const initialState: IncomingCallState = {
  visible: false,
  fromUserId: '',
  fromName: '',
  fromAvatar: '',
  isVideo: false,
  isGroup: false,
  groupName: '',
  groupAvatar: '',
};

const incomingCallSlice = createSlice({
  name: 'incomingCall',
  initialState,
  reducers: {
    showIncomingCall: (
      _state,
      action: PayloadAction<IncomingCallState>
    ) => {
      return { ...action.payload, visible: true };
    },
    hideIncomingCall: () => initialState,
  },
});

export const { showIncomingCall, hideIncomingCall } = incomingCallSlice.actions;
export default incomingCallSlice.reducer;