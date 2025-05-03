import React from 'react';
import { Conversation } from '../../../redux/slice/types'; 

// interface Conversation {
//   _id: string;
//   groupName: string;
//   avatar: string;
//   isOnline?: boolean;
//   isGroup?: boolean;
//   unreadCount: number;
//   lastMessage?: string;
// }

// interface Message {
//   conversationId: string;
//   senderId: string;
//   name: string; // Tên người gửi
//   content: string;
//   timestamp: string;
//   senderAvatar: string; // Nếu là chat nhóm, mỗi tin nhắn có avatar riêng
//   isSentByUser: boolean;
//   type: string; // Loại tin nhắn (text, emoji, image, v.v.)
//   isDeleted: boolean; // Nếu tin nhắn đã bị xóa
//   isPinned: boolean; // Nếu tin nhắn đã được ghim
// }
// interface Conversation {
//   _id: string; // ID của cuộc trò chuyện
//   groupName: string;
//   avatar: string;
//   isOnline?: boolean;
//   isGroup: boolean;
//   unreadCount?: number;
//   adminId?: string; // Nếu là nhóm, ID của người quản trị nhóm
//   members: { userId: string; name: string; avatar: string }[]; // Danh sách thành viên trong nhóm
//   messages: Message[]; // Danh sách tin nhắn trong cuộc trò chuyện
//   lastMessage?: string;
// }

interface ConversationItemProps {
  conversation: Conversation;
  onSelectConversation: (conversation: Conversation) => void;
  isSelected: boolean;
}

const ConversationItem: React.FC<ConversationItemProps> = ({ conversation, onSelectConversation, isSelected }) => {
  return (
    <div
      className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer relative 
        ${isSelected ? 'bg-cyan-600/30' : 'bg-gray-700 hover:bg-gray-600'}`}
      onClick={() => onSelectConversation(conversation)}
    >
      {/* Avatar */}
      <div className="relative">
        <img src={conversation.avatar} alt={conversation.groupName} className="w-10 h-10 rounded-full" />
        
        {/* ✅ Icon online nằm trên cùng bên trái */}
        {conversation.isOnline && (
          <div className="absolute top-0 left-0 w-3 h-3 bg-green-500 rounded-full border border-gray-700"></div>
        )}
      </div>

      {/* Nội dung */}
      <div className="flex-1 min-w-0">
        <h3 className="text-white">{conversation.groupName}</h3>
        <p className="text-gray-400 text-sm truncate w-[180px]">{conversation.lastMessage}</p>

      </div>

      {/* ✅ Badge tin nhắn chưa đọc nằm bên phải cạnh tên */}
      {typeof conversation.unreadCount === 'number' && conversation.unreadCount > 0 && (
        <div className="bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full text-[10px] border border-gray-700 ml-auto">
          {conversation.unreadCount}
        </div>
      )}
    </div>
  );
};

export default ConversationItem;