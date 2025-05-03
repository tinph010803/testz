export interface Member {
    userId: string;
    name: string;
    avatar: string;
  }
  
  export interface Message {
    _id?: string;
    conversationId: string;
    senderId: string;
    content: string; // Nội dung tin nhắn (có thể là text hoặc binary data)
    timestamp: string;
    name: string; // Tên người gửi (nếu là nhóm)
    senderAvatar: string;
    isSentByUser: boolean;
    type: 'text' | 'emoji' | 'image' | 'file' | 'video' | 'audio';
    isDeleted: boolean;
    isPinned: boolean;
    fileName?: string; // Tên file (nếu có)
    fileType?: string; // Kiểu file (nếu có)
  }
  
  export interface Conversation {
    _id: string;
    groupName: string;
    avatar: string;
    isGroup: boolean;
    messages: Message[];
    members: Member[];
    adminId?: string;
    unreadCount?: number;
    isOnline?: boolean;
    updatedAt?: string;
    createdAt?: string;
    lastMessage?: string;
  }
  
  export interface ConversationSidebarProps {
    conversations: Conversation[];
    onSelectConversation: (conversation: Conversation) => void;
    selectedConversationId: string;
  }
  