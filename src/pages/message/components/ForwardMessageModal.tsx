import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Conversation, Message } from '../../../redux/slice/types';

interface ForwardMessageModalProps {
  message: Message;
  conversations: Conversation[];
  onClose: () => void;
  onForward: (message: Message, toConversations: string[]) => void;
}

const ForwardMessageModal: React.FC<ForwardMessageModalProps> = ({
  message,
  conversations,
  onClose,
  onForward
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleConfirm = () => {
    onForward(message, selectedIds);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-gray-500/20 flex items-center justify-center z-50">
      <div className="bg-[#1e1e1e] rounded-lg w-[400px] max-h-[90vh] overflow-y-auto p-6 relative">
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-white cursor-pointer">
          <X size={20} />
        </button>
        <h2 className="text-white text-lg font-semibold mb-4">Forward message to</h2>

        <div className="space-y-2">
          {conversations.map((conv) => (
            <div
              key={conv._id}
              className="flex items-center justify-between p-2 bg-gray-800 rounded-md"
            >
              <div className="flex items-center gap-2">
                <img src={conv.avatar} alt="avatar" className="w-8 h-8 rounded-full" />
                <span className="text-white">{conv.groupName}</span>
              </div>
              <input
                type="checkbox"
                checked={selectedIds.includes(conv._id)}
                onChange={() => toggleSelect(conv._id)}
                className="w-4 h-4 accent-green-500 cursor-pointer rounded"
              />
            </div>
          ))}
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={handleConfirm}
            disabled={selectedIds.length === 0}
            className={`px-4 py-2 rounded text-sm font-medium transition-colors
              ${selectedIds.length === 0
                ? 'bg-gray-500 text-white cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700 text-white cursor-pointer'
              }`}
          >
            Forward
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForwardMessageModal;
