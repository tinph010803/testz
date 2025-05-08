import { useEffect, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import socket from '../utils/socket';
import { RootState, AppDispatch } from '../redux/store';
import {
  addMessageToState, getAllConversations, revokeMessageLocal,
  deleteMessageLocal, addConversation, setSelectedConversation,
  removeMemberFromConversation, updateAdminInConversation, removeConversation, addMemberToConversation,
  updateGroupAvatar, updateGroupName,
  unhideConversation, deleteConversation
} from '../redux/slice/chatSlice';
import { Message, Member } from '../redux/slice/types';
import { toast } from 'react-toastify';

const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const user = useSelector((state: RootState) => state.auth.user);
  const conversations = useSelector((state: RootState) => state.chat.conversations);
  const dispatch = useDispatch<AppDispatch>();

  const hasConnected = useRef(false);
  const conversationsRef = useRef(conversations);

  // Cập nhật conversationsRef mỗi lần conversations thay đổi
  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  // ✅ useCallback để đảm bảo reference không đổi
  const handleReceiveMessage = useCallback((newMessage: Message) => {
    if (!user) return;

    console.log('📩 Received message from socket:', newMessage);

    dispatch(addMessageToState({
      message: {
        ...newMessage,
        isSentByUser: newMessage.senderId === user?._id
      },
      currentUserId: user._id,
    }));

    const targetConversation = conversationsRef.current.find(c => c._id === newMessage.conversationId);
    if (targetConversation?.hidden) {
      dispatch(unhideConversation(newMessage.conversationId));
    }
  }, [user, dispatch]);

  useEffect(() => {
    if (!user?._id || hasConnected.current){
      console.log('Socket already connected or user not logged in. Skipping connection.');
      return;
    } 

    socket.connect();
    socket.emit('setup', user._id);
    dispatch(getAllConversations(user._id)); // Load tất cả conversation

    hasConnected.current = true;

    socket.on('receiveMessage', handleReceiveMessage);

    // Lắng nghe cuộc trò chuyện mới từ socket
    socket.on('newConversation', (newConversation) => {
      console.log('📩 New conversation received:', newConversation);

      if (!newConversation.isGroup) {
        // Tìm người còn lại trong cuộc trò chuyện
        const otherMember = newConversation.members.find((member: Member) => member.userId !== user._id);

        // Nếu tìm thấy người còn lại, cập nhật groupName và avatar
        if (otherMember) {
          newConversation.groupName = otherMember.name; // Lưu tên người còn lại
          newConversation.avatar = otherMember.avatar || ''; // Lưu avatar của người còn lại
        }
      }

      dispatch(addConversation(newConversation)); // Cập nhật cuộc trò chuyện mới vào Redux

      const isPrivate = !newConversation.isGroup;
      const isGroupAdmin = newConversation.adminId === user._id;

      if ((isPrivate && newConversation.members[0].userId === user._id) || isGroupAdmin) {
        dispatch(setSelectedConversation(newConversation));
      }
    });

    socket.on('messageRevoked', ({ messageId, senderId, conversationId }) => {
      console.log(`❌ Message ${messageId} was revoked`);
      if (senderId !== user._id) {
        dispatch(revokeMessageLocal({ messageId, conversationId }));
      }
    });

    socket.on('messageDeleted', ({ messageId, senderId, conversationId }) => {
      console.log(`❌ Message ${messageId} was deleted`);
      if (senderId !== user._id) {
        dispatch(deleteMessageLocal({ messageId, conversationId }));
      }
    });

    // Khi bị xóa khỏi nhóm
    socket.on('memberRemoved', ({ conversationId, userId }) => {
      if (userId === user._id) {
        toast.warning('You have been removed from the group chat!');
        dispatch(removeConversation(conversationId));
      } else {
        dispatch(removeMemberFromConversation({ conversationId, userId }));
      }
    });

    // Khi có thành viên rời nhóm
    socket.on('memberLeft', ({ conversationId, userId }) => {
      if (userId === user._id) {
        toast.info('You have left the group chat.');
        dispatch(removeConversation(conversationId));
      } else {
        dispatch(removeMemberFromConversation({ conversationId, userId }));
      }
    });

    // Khi chuyển admin
    socket.on('adminTransferred', ({ conversationId, newAdminId }) => {
      dispatch(updateAdminInConversation({ conversationId, newAdminId }));
    });

    socket.on('memberAdded', ({ conversationId, newMembers }) => {
      dispatch(addMemberToConversation({ conversationId, newMembers }));

      newMembers.forEach((member: Member) => {
        if (member.userId === user._id) {
          toast.info('You have been added to a group chat!');
          
          dispatch(deleteConversation({
            conversationId,
            userId: member.userId,
          }));
        }
      });
    });

    socket.on('groupAvatarUpdated', ({ conversationId, avatar }) => {
      dispatch(updateGroupAvatar({ conversationId, avatar }));
    });

    socket.on('groupNameUpdated', ({ conversationId, groupName }) => {
      dispatch(updateGroupName({ conversationId, groupName }));
    });

    return () => {
      socket.off('receiveMessage', handleReceiveMessage);
      socket.off('newConversation');
      socket.off('messageRevoked');
      socket.off('messageDeleted');
      socket.off('memberRemoved');
      socket.off('adminTransferred');
      socket.off('memberAdded');
      socket.off('groupAvatarUpdated');
      socket.off('groupNameUpdated');
      socket.off('memberLeft');
      socket.disconnect();
      hasConnected.current = false;
    };
  }, [user?._id, dispatch, handleReceiveMessage]);

  // 🔁 2. Mỗi khi conversation thay đổi → join lại các room
  useEffect(() => {
    if (!socket.connected) return;

    conversations.forEach((conv) => {
      socket.emit('joinRoom', conv._id);
    });
  }, [conversations]);

  return <>{children}</>;
};

export default SocketProvider;