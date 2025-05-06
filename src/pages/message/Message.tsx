import React, { useEffect } from 'react';
import { ConversationSidebar, ConversationDetail, CallModal } from './components';
// import { addMessageToState } from '../../redux/slice/chatSlice';
import { useDispatch, useSelector } from 'react-redux';
import { resetUnreadCount, setSelectedConversation, setUnreadToZero } from '../../redux/slice/chatSlice';
import { RootState, AppDispatch } from '../../redux/store';
import { Conversation, Member } from '../../redux/slice/types';
import IncomingCallModal from './components/incomingCallModal';
import { showIncomingCall } from '../../redux/slice/incomingCallSlice';
import socket from '../../utils/socket';
import socketCall from '../../utils/socketCall';
import { rejectedCall } from '../../redux/slice/callSlice';

const Message: React.FC = () => {
  // const [conversations, setConversations] = useState(initialConversations);
  //   const [selectedConversation, setSelectedConversation] = useState(conversations[0]);
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const conversations = useSelector((state: RootState) => state.chat.conversations);
  const selectedConversation = useSelector((state: RootState) => state.chat.selectedConversation);
  
  useEffect(() => {
    if (user?._id) {
      socketCall.connect(); // <-- QUAN TRỌNG
      socketCall.emit('join', { userId: user._id });
  
      socketCall.on('incomingCall', (data) => {
        console.log("📞 incomingCall:", data);
        console.log("👤 this user:", user._id);
        if (data.toUserId === user._id) {
          dispatch(showIncomingCall({ ...data, visible: true }));
        }
      });
    }
  
    return () => {
      socketCall.off('incomingCall');
    };
  }, [user, dispatch]);
  
  useEffect(() => {
    socketCall.on("callRejected", () => {
      dispatch(rejectedCall()); // 👈 Kích hoạt trạng thái từ chối
    });
  
    return () => {
      socketCall.off("callRejected");
    };
  }, [dispatch]);
  
  for (const conversation of conversations) {
    console.log('Conversation aaaaaaa:', conversation); // Kiểm tra từng cuộc trò chuyện
  }

  const handleSelectConversation = (conversation: Conversation) => {
    if (!user) return;

    // 🔥 Join room khi chọn conversation
    socket.emit("joinRoom", conversation._id);
    const fullConversation = conversations.find((c) => c._id === conversation._id);
    if (!fullConversation) return;
    
    const updateConversation = {
      ...fullConversation,
      groupName: fullConversation.isGroup && fullConversation.groupName
        ? fullConversation.groupName
        : getOtherUserName(fullConversation.members),
      avatar: fullConversation.isGroup && fullConversation.avatar
        ? fullConversation.avatar
        : getOtherUserAvatar(fullConversation.members),
      unreadCount: 0,
    };


    console.log('Updated conversation:', updateConversation); // Kiểm tra cuộc trò chuyện đã cập nhật
    dispatch(setSelectedConversation(updateConversation)); // Cập nhật cuộc trò chuyện đã chọn trong Redux
    dispatch(setUnreadToZero(conversation._id));
    dispatch(resetUnreadCount({
      userId: user._id,
      conversationId: conversation._id
    }));
  };

  // Lấy tên người còn lại trong cuộc trò chuyện (không phải user hiện tại)
  const getOtherUserName = (members: Member[]) => {
    if (!user) return '';
    const otherMember = members.find((member) => member.userId !== user._id);
    return otherMember ? otherMember.name : '';
  };

  // Lấy avatar người còn lại trong cuộc trò chuyện
  const getOtherUserAvatar = (members: Member[]) => {
    if (!user) return '';
    const otherMember = members.find((member) => member.userId !== user._id);
    return otherMember ? otherMember.avatar : '';
  };

  return (
    <>
      <div className="flex h-screen">
        {/* <ConversationSidebar />
      <ConversationDetail /> */}
        <ConversationSidebar
          onSelectConversation={handleSelectConversation}
          selectedConversationId={selectedConversation?._id || ''}
          conversations={conversations}
        />
        {/* Truyền selectedConversation vào ConversationDetail */}
        <ConversationDetail selectedConversation={selectedConversation} />
      </div>
      <CallModal />
      <IncomingCallModal />
    </>
  );
};

export default Message;
