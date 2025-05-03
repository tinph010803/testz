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
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "../../../redux/store";
import { createComment, getCommentsByPost, resetComments, getCommentCountsByPosts } from "../../../redux/slice/commentSilce";
import commentSocket from "../../../utils/socketComment"; // ✅ Correct socket instance
import { likePost, unlikePost } from "../../../redux/slice/likeSlice";
interface Props {
  isOpen: boolean;
  onClose: () => void;
  mediaList: string[];
  startIndex: number;
  username: string;
  avatar: string;
  content: string;
  fullView?: boolean;
  postId: string;
}

const ImageModal = ({
  isOpen,
  onClose,
  mediaList,
  startIndex,
  username,
  avatar,
  content,
  postId,
}: Props) => {
  const [index, setIndex] = useState(startIndex);
  const [commentText, setCommentText] = useState("");
  const dispatch = useDispatch<AppDispatch>();
  const { comments } = useSelector((state: RootState) => state.comments);
  const authUser = useSelector((state: RootState) => state.auth.userDetail);
  const likeCounts = useSelector((state: RootState) => state.likes.likeCounts);
  const likes = likeCounts[postId] || 0;
  const likedPostIds = useSelector((state: RootState) => state.likes.likedPostIds);
  const isLiked = likedPostIds.includes(postId);
  useEffect(() => {
    setIndex(startIndex);
  }, [startIndex]);

  useEffect(() => {
    setIndex(startIndex);
    if (isOpen) {
      dispatch(resetComments()); // 🧹 reset comment cũ khi mở modal mới
      if (postId) dispatch(getCommentsByPost(postId));
    }
  }, [isOpen, startIndex, dispatch, postId]);

  useEffect(() => {
    if (!commentSocket.connected) commentSocket.connect();

    if (postId) {
      const eventName = `receive-comment-${postId}`;
      const handler = (data: any) => {
        console.log("📥 Received socket event:", eventName, data); // ✅ THÊM LOG
        dispatch(getCommentsByPost(postId));
      };

      commentSocket.on(eventName, handler);
      return () => {
        commentSocket.off(eventName, handler);
      };
    }
  }, [dispatch, postId]);
  const handleToggleLike = () => {
    if (!postId) return;
    if (isLiked) {
      dispatch(unlikePost(postId));
    } else {
      dispatch(likePost(postId));
    }
  };


  const handleSubmitComment = async () => {
    console.log("🟡 handleSubmitComment running...");
    if (postId && commentText.trim()) {
      try {
        const newComment = await dispatch(createComment({ postId, text: commentText })).unwrap();
        commentSocket.emit("send-comment", newComment);
        dispatch(getCommentCountsByPosts([postId]));
        setCommentText("");
      } catch (err) {
        console.error("❌ Failed to create comment:", err);
      }
    } else {
      console.warn("⚠️ Missing postId or empty comment");
    }
  };


  const currentMedia = mediaList[index] || "";
  const isVideo = /\.(mp4|webm|ogg)$/i.test(currentMedia);

  const goNext = () => setIndex((prev) => (prev + 1) % mediaList.length);
  const goPrev = () => setIndex((prev) => (prev - 1 + mediaList.length) % mediaList.length);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black flex">
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
    className="w-auto max-w-[100%] h-auto max-h-[100%] object-contain rounded-xl"
  />
) : (
  <img
    src={currentMedia}
    alt="preview"
    className="w-auto max-w-[100%] h-auto max-h-[100%] object-contain rounded-xl"
  />
)}

      </div>

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
            <button
              className={`flex items-center gap-1 ${isLiked ? "text-red-500" : "text-zinc-400"} cursor-pointer`}
              onClick={handleToggleLike}
            >
              <Heart size={18} />
              <span className="text-sm">{likes}</span>
            </button>


            <div className="flex items-center gap-1 cursor-pointer">
              <MessageCircle size={18} /> <span className="text-sm">{comments.length}</span>
            </div>
            <div className="cursor-pointer">
              <Bookmark size={18} />
            </div>
          </div>
        </div>

        <div className="px-4 py-3 flex-1 overflow-y-auto space-y-4">
          {comments.map((comment) => (
            <div key={comment._id} className="flex items-start gap-3">
              <img
                src={comment.user?.avatar || "https://i.postimg.cc/7Y7ypVD2/avatar-mac-dinh.jpg"}
                className="w-9 h-9 rounded-full object-cover"
                alt="avatar"
              />
              <div className="bg-zinc-800 px-3 py-2 rounded-xl max-w-[300px]">
                <p className="text-sm font-semibold leading-none mb-1">
                  {comment.user?.firstname} {comment.user?.lastname}
                </p>
                <p className="text-sm text-zinc-300">{comment.text}</p>
              </div>
            </div>
          ))}
        </div>


        <div className="px-4 py-3 border-t border-zinc-800">
          <div className="flex items-center gap-2">
            <img
              src={authUser?.avatar || "https://i.postimg.cc/7Y7ypVD2/avatar-mac-dinh.jpg"}
              className="w-9 h-9 rounded-full object-cover"
              alt="avatar"
            />
            <input
              type="text"
              placeholder="Viết bình luận..."
              className="flex-1 px-4 py-2 bg-zinc-800 text-white rounded-full outline-none text-sm"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmitComment()}
            />
            <button
              onClick={handleSubmitComment}
              className="bg-green-500 hover:bg-green-600 w-10 h-10 flex items-center justify-center rounded-md"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>

          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageModal;
