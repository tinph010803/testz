// File: ImageModal.tsx
import { useEffect, useState } from "react";
import {
  X,
  Heart,
  MessageCircle,
  Bookmark,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  mediaList: string[];
  startIndex: number;
  username: string;
  avatar: string;
  content: string;
  fullView?: boolean;
}

const ImageModal = ({
  isOpen,
  onClose,
  mediaList,
  startIndex,
  username,
  avatar,
  content,
  fullView = false,
}: Props) => {
  const [index, setIndex] = useState(startIndex);

  useEffect(() => {
    setIndex(startIndex); // reset index when modal reopens
  }, [startIndex]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  if (!isOpen) return null;

  const currentMedia = mediaList[index];
  const isVideo = currentMedia.match(/\.(mp4|webm|ogg)$/i);

  const goNext = () => setIndex((prev) => (prev + 1) % mediaList.length);
  const goPrev = () => setIndex((prev) => (prev - 1 + mediaList.length) % mediaList.length);

  return (
    <div className="fixed inset-0 z-50 bg-black flex">
      {/* Left: Image/Video */}
      <div className="flex-1 relative flex items-center justify-center bg-black">
        {mediaList.length > 1 && (
          <>
            <button
              onClick={goPrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 p-2 rounded-full text-white z-10 cursor-pointer"
            >
              <ChevronLeft size={28} />
            </button>
            <button
              onClick={goNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 p-2 rounded-full text-white z-10 cursor-pointer"
            >
              <ChevronRight size={28} />
            </button>
          </>
        )}

        {isVideo ? (
          <video
            src={currentMedia}
            autoPlay
            controls
            className={fullView ? "w-full h-full object-contain" : "max-h-screen max-w-full object-contain rounded-xl"}
          />
        ) : (
          <img
            src={currentMedia}
            alt="preview"
            className={fullView ? "w-full h-full object-contain" : "max-h-screen max-w-full object-contain rounded-xl"}
          />
        )}
      </div>

      {/* Right: info */}
      <div className="w-[420px] bg-zinc-900 text-white flex flex-col border-l border-zinc-800">
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <img src={avatar} className="w-10 h-10 rounded-full object-cover" />
            <div>
              <p className="font-semibold text-base leading-4">{username}</p>
              <p className="text-xs text-zinc-400 mt-1">2 giờ trước</p>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white cursor-pointer">
            <X size={22} />
          </button>
        </div>

        <div className="p-4 border-b border-zinc-800 text-sm">
          <p className="text-zinc-200 whitespace-pre-line mb-3">{content}</p>

          <div className="flex items-center gap-6 text-zinc-400">
            <div className="flex items-center gap-1 cursor-pointer">
              <Heart size={18} /> <span className="text-sm">0</span>
            </div>
            <div className="flex items-center gap-1 cursor-pointer">
              <MessageCircle size={18} /> <span className="text-sm">0</span>
            </div>
            <div className="cursor-pointer">
              <Bookmark size={18} />
            </div>
          </div>
        </div>

        <div className="px-4 py-3 flex-1 overflow-y-auto space-y-4">
          <div className="flex items-start gap-3">
            <img
              src="https://i.postimg.cc/7Y7ypVD2/avatar-mac-dinh.jpg"
              className="w-9 h-9 rounded-full object-cover"
              alt="avatar"
            />
            <div className="bg-zinc-800 px-3 py-2 rounded-xl max-w-[300px]">
              <p className="text-sm font-semibold leading-none mb-1">Truong Giang</p>
              <p className="text-sm text-zinc-300">
                Anh có chơi S3 không thì chúng mình PT chặn cổng Lorencia :)))
              </p>
            </div>
          </div>
        </div>

        <div className="px-4 py-3 border-t border-zinc-800">
          <div className="flex items-center gap-2">
            <img
              src="https://i.postimg.cc/7Y7ypVD2/avatar-mac-dinh.jpg"
              className="w-9 h-9 rounded-full object-cover"
              alt="avatar"
            />
            <input
              type="text"
              placeholder="Viết bình luận..."
              className="flex-1 px-4 py-2 bg-zinc-800 text-white rounded-full outline-none text-sm"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageModal;
