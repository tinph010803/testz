import { useEffect, useRef, useState } from "react";
import { Heart, MessageCircle, Bookmark, MoreHorizontal } from "lucide-react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import ImageModal from "./ImageModal";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../../redux/store";
import { deletePost, fetchUserPosts } from "../../../redux/slice/postProfileSlice";
import { likePost, unlikePost, fetchLikeCounts } from "../../../redux/slice/likeSlice";

dayjs.extend(relativeTime);

const timeAgo = (dateString: string): string => {
  const now = dayjs();
  const created = dayjs(dateString);
  const diffInSeconds = now.diff(created, "second");
  if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
  const diffInMinutes = now.diff(created, "minute");
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = now.diff(created, "hour");
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = now.diff(created, "day");
  if (diffInDays < 30) return `${diffInDays}d ago`;
  const diffInMonths = now.diff(created, "month");
  if (diffInMonths < 12) return `${diffInMonths}mo ago`;
  const diffInYears = now.diff(created, "year");
  return `${diffInYears}y ago`;
};

interface Post {
  _id: string;
  content: string;
  createdAt: string;
  likes?: number;
  comments?: number;
  media?: string[];
  tags?: string[];
}

const Posts = ({ posts, username, avatar }: { posts: Post[]; username: string; avatar: string }) => {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    if (posts.length > 0) {
      const postIds = posts.map((p) => p._id);
      dispatch(fetchLikeCounts(postIds));
      // dispatch(fetchUserLikedPosts());
    }
  }, [dispatch, posts]);

  return (
    <div className="divide-zinc-800">
      {posts.map((post, index) => (
        <PostCard
          key={index}
          postId={post._id}
          user={username}
          avatar={avatar}
          content={post.content}
          time={timeAgo(post.createdAt)}
          comments={post.comments ?? 0}
          media={post.media || []}
          tags={post.tags || []}
        />
      ))}
    </div>
  );
};

const PostCard = ({
  postId,
  user,
  avatar,
  content,
  time,
  comments,
  media,
  tags,
}: {
  postId: string;
  user: string;
  avatar: string;
  content: string;
  time: string;
  comments: number;
  media: string[];
  tags: string[];
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [startIndex, setStartIndex] = useState(0);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const dispatch = useDispatch<AppDispatch>();

  const currentUserId = useSelector((state: RootState) => state.auth.user?._id);
  const likeCount = useSelector((state: RootState) => state.likes.likeCounts[postId] || 0);
  const likedPostIds = useSelector((state: RootState) => state.likes.likedPostIds);
  
  const isLiked = likedPostIds.includes(postId);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleDeletePost = async () => {
    try {
      await dispatch(deletePost(postId)).unwrap();
      if (currentUserId) await dispatch(fetchUserPosts(currentUserId));
    } catch (err) {
      alert("Delete post failed: " + err);
    }
  };

  const handleToggleLike = () => {
    if (!currentUserId) return;
    if (isLiked) {
      dispatch(unlikePost(postId));
    } else {
      dispatch(likePost(postId));
    }
  };

  return (
    <div className="p-4 hover:bg-zinc-900/50">
      <div className="flex items-start gap-3">
        <img src={avatar} alt="Avatar" className="w-10 h-10 rounded-full" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">{user}</h3>
              <p className="text-xs text-zinc-500">{time}</p>
            </div>
            <div className="relative">
              <button className="text-zinc-500 cursor-pointer" onClick={() => setShowMenu((prev) => !prev)}>
                <MoreHorizontal size={20} />
              </button>
              {showMenu && (
                <div
                  ref={menuRef}
                  className="absolute right-0 mt-2 w-36 bg-zinc-800 shadow-lg rounded-lg z-50 py-2"
                >
                  <button className="flex justify-between items-center w-full px-4 py-2 hover:bg-zinc-700 text-white cursor-pointer">
                    Edit
                  </button>
                  <button
                    className="flex justify-between items-center w-full px-4 py-2 hover:bg-zinc-700 text-red-400 cursor-pointer"
                    onClick={handleDeletePost}
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>

          <p className="mt-2">{content}</p>

          {media.length > 0 && (
            <div className="mt-3 grid grid-cols-2 gap-1 w-full rounded-xl overflow-hidden">
              {media.slice(0, 4).map((url, idx) => {
                const isLastVisible = idx === 3 && media.length > 4;
                const isVideo = url.match(/\.(mp4|webm|ogg)$/i);
                return (
                  <div
                    key={idx}
                    className="relative cursor-pointer overflow-hidden"
                    onClick={() => {
                      setStartIndex(idx);
                      setIsModalOpen(true);
                    }}
                  >
                    {isVideo ? (
                      <video controls className="w-full h-[300px] object-cover" preload="metadata">
                        <source src={url} type="video/mp4" />
                      </video>
                    ) : (
                      <img src={url} alt={`media-${idx}`} className="w-full h-[300px] object-cover" />
                    )}
                    {isLastVisible && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-xl font-bold">
                        +{media.length - 3}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2 text-sm text-green-400">
              {tags.map((tag, i) => (
                <span key={i}>#{tag}</span>
              ))}
            </div>
          )}

          <div className="flex items-center gap-6 mt-3">
            <button
              className={`flex items-center gap-2 ${
                currentUserId && isLiked ? "text-red-500" : "text-zinc-500"
              } cursor-pointer`}
              onClick={handleToggleLike}
              disabled={!currentUserId}
            >
              <Heart size={20} />
              <span>{likeCount}</span>
            </button>
            <button className="flex items-center gap-2 text-zinc-500 cursor-pointer">
              <MessageCircle size={20} />
              <span>{comments}</span>
            </button>
            <button className="text-zinc-500 cursor-pointer">
              <Bookmark size={20} />
            </button>
          </div>
        </div>
      </div>

      <ImageModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        mediaList={media}
        startIndex={startIndex}
        username={user}
        avatar={avatar}
        content={content}
        fullView
      />
    </div>
  );
};

export default Posts;
