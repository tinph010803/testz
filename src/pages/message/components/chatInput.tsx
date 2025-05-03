import React, { useState } from 'react';
import { Upload, SendHorizonal, Smile, Trash2 } from 'lucide-react';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';
import { useSelector } from 'react-redux';
import { RootState } from '../../../redux/store';
import socket from '../../../utils/socket';
import { Message } from '../../../redux/slice/types';
import { fileIcons } from '../../../assets';

const ChatInput: React.FC = () => {
  const [message, setMessage] = useState('');
  const [isEmojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const userDetail = useSelector((state: RootState) => state.auth.userDetail);
  const selectedConversation = useSelector((state: RootState) => state.chat.selectedConversation);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = async () => {
    if (!selectedConversation?._id) {
      console.error('No conversation selected');
      return;
    }

    if (!userDetail) {
      console.error('No user detail found');
      return;
    }

    if (message.trim()) {
      const textMessage: Message = {
        conversationId: selectedConversation._id,
        senderId: userDetail.userId,
        name: `${userDetail.firstname} ${userDetail.lastname}`,
        content: message.trim(),
        type: "text",
        timestamp: new Date().toISOString(),
        isDeleted: false,
        isSentByUser: true,
        isPinned: false,
        senderAvatar: userDetail?.avatar,
      };

      socket.emit('sendMessage', textMessage);
      // dispatch(addMessageToState({
      //   message: textMessage,
      //   currentUserId: userDetail.userId,
      // }));
    }

    // Gửi từng file theo thứ tự
    for (const file of selectedFiles) {
      const fileType = file.type.split('/')[0];
      let messageType: "image" | "video" | "audio" | "file" = "file";

      if (fileType === "image") messageType = "image";
      else if (fileType === "video") messageType = "video";
      else if (fileType === "audio") messageType = "audio";

      const fileContent = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
      });

      const fileMessage: Message = {
        conversationId: selectedConversation._id,
        senderId: userDetail.userId,
        name: `${userDetail.firstname} ${userDetail.lastname}`,
        content: fileContent,
        type: messageType,
        timestamp: new Date().toISOString(),
        isDeleted: false,
        isSentByUser: true,
        isPinned: false,
        senderAvatar: userDetail?.avatar,
        fileName: file.name,
        fileType: file.type,
      };

      socket.emit('sendMessage', fileMessage);
      // dispatch(addMessageToState({
      //   message: fileMessage,
      //   currentUserId: userDetail.userId,
      // }));
    }

    // Xoá nội dung sau khi gửi xong
    setMessage('');
    setSelectedFiles([]);
  };


  const handleEmojiClick = (emojiObject: EmojiClickData) => {
    setMessage((prevMessage) => prevMessage + emojiObject.emoji);
    setEmojiPickerOpen(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files); // Chuyển đổi files thành mảng
      setSelectedFiles((prevFiles) => [...prevFiles, ...filesArray]); // Thêm ảnh mới vào mảng đã có
    }
  };

  const handleRemoveFile = (fileIndex: number) => {
    setSelectedFiles(prev => prev.filter((_, index) => index !== fileIndex));
  };

  const handleRemoveAllFiles = () => {
    setSelectedFiles([]); // Xóa tất cả ảnh
  };

  // Xử lý khi người dùng chọn file
  // const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const files = e.target.files ? Array.from(e.target.files) : [];
  //   setSelectedFiles(files);
  //   const previews: string[] = [];
  //   files.forEach((file) => {
  //     const reader = new FileReader();
  //     reader.onloadend = () => {
  //       previews.push(reader.result as string);
  //       if (previews.length === files.length) {
  //         setFilePreviews(previews); // Set previews once all files are read
  //       }
  //     };
  //     reader.readAsDataURL(file); // Convert files to base64 for preview
  //   });
  // };

  // const clearFile = (index: number) => {
  //   const updatedFiles = selectedFiles.filter((_, i) => i !== index);
  //   const updatedPreviews = filePreviews.filter((_, i) => i !== index);
  //   setSelectedFiles(updatedFiles);
  //   setFilePreviews(updatedPreviews);
  // };

  // const clearAllFiles = () => {
  //   setSelectedFiles([]);
  //   setFilePreviews([]);
  // };

  const isImageFile = (file: File) => {
    return file.type.startsWith("image/");
  };

  const getFileIcon = (fileName: string = '') => {
    const ext = fileName.split('.').pop()?.toLowerCase();

    if (!ext) return fileIcons.doc; // fallback

    switch (ext) {
      case 'pdf':
        return fileIcons.pdf;
      case 'doc':
      case 'docx':
        return fileIcons.doc;
      case 'xls':
      case 'xlsx':
        return fileIcons.xls;
      case 'zip':
      case 'rar':
        return fileIcons.zip;
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
        return fileIcons.image;
      case 'mp4':
      case 'mov':
      case 'avi':
        return fileIcons.video;
      case 'mp3':
      case 'wav':
        return fileIcons.sound;
      default:
        return fileIcons.doc;
    }
  };

  return (
    <div className="p-3 bg-[#282828b2] flex flex-col rounded-xl">
      <div className='p-3 bg-[#282828b2] flex items-center rounded-xl w-full'>
        {/* Nút Upload */}
        <input type="file" className="hidden" id="fileInput" multiple onChange={handleFileChange} />
        <label htmlFor="fileInput" className="cursor-pointer">
          <Upload size={20} className="text-white" />
        </label>

        {/* Input text with Emoji button inside */}
        <div className="relative flex-1 mx-2 w-full">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="w-full p-2 pl-2 pr-10 rounded-xl bg-[#1212124C]/50 text-white focus:outline-none "
          />

          {/* Emoji button inside input */}
          <button
            className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer"
            onClick={() => setEmojiPickerOpen(!isEmojiPickerOpen)}
          >
            <Smile size={18} className="text-white" />
          </button>

          {/* Emoji Picker */}
          {isEmojiPickerOpen && (
            <div className="absolute bottom-12 right-0 p-2 rounded-md shadow-md z-8 w-full max-w-sm overflow-hidden">
              <EmojiPicker onEmojiClick={handleEmojiClick} />
            </div>
          )}
        </div>

        {/* Nút gửi */}
        <button
          onClick={handleSend}
          className="bg-green-500 px-4 py-2 rounded-lg text-white flex items-center cursor-pointer"
        >
          <SendHorizonal size={20} />
        </button>
      </div>


      {/* Selected Files */}
      {selectedFiles.length > 0 && (
        <div className="mt-2 flex gap-2">
          <div className="flex flex-wrap gap-2">
            {selectedFiles.map((file, index) => {
              const isImage = isImageFile(file);
              const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
              const icon = getFileIcon(file.name);
              return (
                <div key={index} className="relative bg-gray-700 rounded-lg flex items-center gap-2 overflow-hidden max-w-[150px]">
                  {isImage ? (
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                  ) : (
                    <img
                      src={icon}
                      alt="file-icon"
                      className="w-10 h-10 object-contain"
                    />
                  )}

                  {!isImage && (
                    <div className="flex-1 w-[110px]">
                      <p className="text-white text-sm truncate w-[86px]">
                        {file.name}
                      </p>
                      <p className="text-gray-400 text-xs uppercase">{fileExtension}</p>
                    </div>
                  )}
                  {/* Delete button inside image */}
                  <button
                    className="absolute top-0 right-0 text-red-500 not-only:rounded-full p-1 cursor-pointer"
                    onClick={() => handleRemoveFile(index)}
                  >
                    <Trash2 size={16} />

                  </button>
                </div>
              );
            })}
          </div>

          {/* Button to remove all files */}
          <button
            onClick={handleRemoveAllFiles}
            className="text-red-500 text-xs cursor-pointer ml-auto"
          >
            Remove all
          </button>
        </div>
      )}
    </div>
  );
};

export default ChatInput;