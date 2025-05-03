import React, { useEffect } from 'react';
import { ConversationSidebar, ConversationDetail, CallModal } from './components';
// import { addMessageToState } from '../../redux/slice/chatSlice';
import { useDispatch, useSelector } from 'react-redux';
import { setSelectedConversation, setUnreadToZero } from '../../redux/slice/chatSlice';
import { RootState, AppDispatch } from '../../redux/store';
import { Conversation, Member } from '../../redux/slice/types';
import IncomingCallModal from './components/incomingCallModal';
import { showIncomingCall } from '../../redux/slice/incomingCallSlice';
import socket from '../../utils/socket';
import socketCall from '../../utils/socketCall';
import { rejectedCall } from '../../redux/slice/callSlice';
// const initialConversations = [
//   {
//     conversationId: "61a1b2c3d4e5f6789abcde01",  // ID cuộc trò chuyện
//     groupName: "Alice", // Tên nhóm / cá nhân
//     avatar: 'https://picsum.photos/200?2',  // Avatar của người hoặc nhóm
//     isOnline: false,
//     isGroup: false,  // Nếu là chat nhóm, set là true
//     unreadCount: 0,
//     members: [
//       { userId: 'user1', name: 'Alice', avatar: 'https://picsum.photos/200?1' },
//       { userId: 'user2', name: 'Bob', avatar: 'https://picsum.photos/200?2' }
//     ],
//     messages: [
//       { 
//         conversationId: "61a1b2c3d4e5f6789abcde01", 
//         senderId: 'user1', 
//         content: 'Hello!', 
//         timestamp: '2025-04-01T10:00:00Z', 
//         isSentByUser: false, 
//         senderAvatar: 'https://picsum.photos/200?1',
//         type: 'text',  // Type of message (text, emoji, image, etc.)
//         isDeleted: false,  // Is the message deleted
//         isPinned: false  // Is the message pinned
//       },
//       { 
//         conversationId: "61a1b2c3d4e5f6789abcde01", 
//         senderId: 'user2', 
//         content: 'Hi there!', 
//         timestamp: '2025-04-01T10:02:00Z', 
//         isSentByUser: true, 
//         senderAvatar: 'https://picsum.photos/200?2',
//         type: 'text',
//         isDeleted: false,
//         isPinned: false
//       }
//     ],
//   },
//   {
//     conversationId: "61a1b2c3d4e5f6789abcde02",
//     groupName: "Developers Group",
//     avatar: 'https://picsum.photos/200?group',
//     isOnline: true,
//     isGroup: true,
//     adminId: 'Alice',
//     unreadCount: 2,
//     members: [
//       { userId: 'Alice', name: 'Alice', avatar: 'https://picsum.photos/200?4' },
//       { userId: 'Bob', name: 'Bob', avatar: 'https://picsum.photos/200?5' },
//       { userId: 'Charlie', name: 'Charlie', avatar: 'https://picsum.photos/200?6' }
//     ],
//     messages: [
//       { 
//         conversationId: "61a1b2c3d4e5f6789abcde02", 
//         senderId: 'Alice', 
//         content: 'Hello everyone!', 
//         timestamp: '2025-04-01T09:30:00Z', 
//         isSentByUser: false, 
//         senderAvatar: 'https://picsum.photos/200?4',
//         type: 'text',
//         isDeleted: false,
//         isPinned: false
//       },
//       { 
//         conversationId: "61a1b2c3d4e5f6789abcde02", 
//         senderId: 'Bob', 
//         content: 'Hi Alice!', 
//         timestamp: '2025-04-01T09:32:00Z', 
//         isSentByUser: false, 
//         senderAvatar: 'https://picsum.photos/200?5',
//         type: 'text',
//         isDeleted: false,
//         isPinned: false
//       },
//     ],
//   }
// ];





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
  // useEffect(() => {
  //   if (token && user) {
  //     dispatch(getAllConversations(user._id)); // Lấy tất cả các cuộc trò chuyện của người dùng
  //   }
  // }, [dispatch, user, token]); // Chỉ gọi lại khi user hoặc token thay đổi

  // const updatedConversations = conversations.map((conversation) => ({
  //   ...conversation,
  //   groupName: conversation.isGroup && conversation.groupName ? conversation.groupName : getOtherUserName(conversation.members),
  //   avatar: conversation.isGroup && conversation.avatar ? conversation.avatar : getOtherUserAvatar(conversation.members),
  //   unreadCount: conversation.unreadCount || 0,
  // }));

  // useEffect(() => {
  //   console.log("Socket ID huhu:", socket.id);
  //   // Lắng nghe sự kiện 'receiveMessage' và cập nhật tin nhắn trong Redux
  //   socket.on('receiveMessage', (newMessage) => {
  //     console.log('New message receivedddddd:', newMessage);
  //     if (!user?._id) return;
  //     if (newMessage.senderId === user._id) return;
  //     // dispatch(addMessageToState(newMessage));
  //     dispatch(addMessageToState({
  //       message: newMessage,
  //       currentUserId: user._id,
  //     }));
  //   });

  //   // Dọn dẹp sự kiện khi component unmount
  //   return () => {
  //     socket.off('receiveMessage');
  //   };
  // }, [dispatch, user]);

  const handleSelectConversation = (conversation: Conversation) => {
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


    console.log('Selected conversationqweqweqweqwe:', conversation); // Kiểm tra cuộc trò chuyện đã chọn
    console.log('Updated conversation:', updateConversation); // Kiểm tra cuộc trò chuyện đã cập nhật
    dispatch(setSelectedConversation(updateConversation)); // Cập nhật cuộc trò chuyện đã chọn trong Redux

    dispatch(setUnreadToZero(conversation._id));
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
