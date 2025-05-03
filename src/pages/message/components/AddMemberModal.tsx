import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Member } from '../../../redux/slice/types';

interface AddMemberModalProps {
  membersInGroup: Member[];
  allUsers: Member[];
  onClose: () => void;
  onAddMembers: (newMembers: Member[]) => void;
}

const AddMemberModal: React.FC<AddMemberModalProps> = ({
  membersInGroup,
  allUsers,
  onClose,
  onAddMembers
}) => {
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  const handleToggle = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleAddMembers = () => {
    const newMembers = allUsers.filter(
      (user) => selectedUsers.includes(user.userId)
    );
    onAddMembers(newMembers);
    onClose();
  };

  const isInGroup = (userId: string) =>
    membersInGroup.some((m) => m.userId === userId);

  return (
    <div className="fixed inset-0 bg-gray-500/20 flex items-center justify-center z-50 font-sans">
      <div className="bg-[#1e1e1e] rounded-lg w-[400px] max-h-[90vh] overflow-y-auto p-6 relative">
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-white cursor-pointer">
          <X size={20} />
        </button>
        <h2 className="text-white text-lg font-semibold mb-4">Add Members to Group</h2>

        <div className="space-y-3">
          {allUsers.map((user) => (
            <div
              key={user.userId}
              className="flex items-center justify-between p-2 bg-gray-800 rounded-md"
            >
              <div className="flex items-center gap-3">
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-8 h-8 rounded-full"
                />
                <span className="text-white font-medium text-sm">{user.name}</span>
              </div>
              {isInGroup(user.userId) ? (
                <span className="text-sm text-gray-400">Already in group</span>
              ) : (
                <input
                  type="checkbox"
                  checked={selectedUsers.includes(user.userId)}
                  onChange={() => handleToggle(user.userId)}
                  className="w-4 h-4 accent-green-500 cursor-pointer rounded"
                />
              )}
            </div>
          ))}
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={handleAddMembers}
            disabled={selectedUsers.length === 0}
            className={`px-4 py-2 rounded-md text-sm text-white transition-colors
                ${selectedUsers.length === 0
                ? 'bg-gray-500 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700 cursor-pointer'
                }`}
          >
            Add Selected
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddMemberModal;