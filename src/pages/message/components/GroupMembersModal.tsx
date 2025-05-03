import React from 'react';
import { X, Crown, Trash2 } from 'lucide-react';
import { useSelector } from 'react-redux';
import { RootState } from '../../../redux/store';
import { Member } from '../../../redux/slice/types';

interface Props {
  members: Member[];
  adminId: string;
  onClose: () => void;
  onRemoveMember: (userId: string) => void;
  onTransferAdmin: (userId: string) => void;
}

const GroupMembersModal: React.FC<Props> = ({
  members,
  adminId,
  onClose,
  onRemoveMember,
  onTransferAdmin,
}) => {
  const currentUserId = useSelector((state: RootState) => state.auth.user?._id);

  const isAdmin = currentUserId === adminId;
// fixed inset-0 bg-gray-500/20 flex items-center justify-center z-50 font-sans
  return (
    <div className="fixed inset-0 bg-gray-500/20 flex items-center justify-center z-50 font-sans">
      <div className="bg-white rounded-lg p-6 w-[400px] max-h-[80vh] overflow-y-auto relative">
        <button
          className="absolute top-2 right-2 text-gray-500 hover:text-black cursor-pointer"
          onClick={onClose}
        >
          <X size={20} />
        </button>

        <h2 className="text-xl font-bold mb-4 text-center text-gray-800">Group Members</h2>

        {members.map((member) => (
          <div key={member.userId} className="flex items-center justify-between p-2 border-b">
            <div className="flex items-center gap-2">
              <img src={member.avatar} alt={member.name} className="w-8 h-8 rounded-full" />
              <span className="text-gray-800">{member.name}</span>
              {adminId === member.userId && (
                <span className="text-yellow-500 ml-1 text-sm font-medium flex items-center">
                  <Crown size={14} className="mr-1" /> Admin
                </span>
              )}
            </div>

            {isAdmin && member.userId !== currentUserId && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onTransferAdmin(member.userId)}
                  className="text-blue-600 hover:underline text-sm cursor-pointer"
                >
                  Transfer
                </button>
                <button
                  onClick={() => onRemoveMember(member.userId)}
                  className="text-red-500 hover:text-red-700 cursor-pointer"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default GroupMembersModal;
