import { ChevronDown, Image, Plus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../redux/store";
import { fetchAllPosts, createPost } from "../redux/slice/postProfileSlice";
import SearchBar from "../pages/explore/components/SearchBar";
import Posts from "../pages/profile/components/Posts";
import { fetchLikeCounts, fetchUserLikedPosts } from "../redux/slice/likeSlice";
import { getCommentCountsByPosts } from "../redux/slice/commentSilce"
import commentSocket from "../utils/socketComment";

const MainContent = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { posts, loading, error } = useSelector((state: RootState) => state.postProfile);
    const userDetail = useSelector((state: RootState) => state.auth.userDetail);
    const [postContent, setPostContent] = useState("");
    const [isExpanded, setIsExpanded] = useState(false);
    const [mediaFiles, setMediaFiles] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [isPosting, setIsPosting] = useState(false);
    const inputRef = useRef<HTMLDivElement>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const commentCounts = useSelector((state: RootState) => state.comments.commentCounts);

    useEffect(() => {
        dispatch(fetchAllPosts());
    }, [dispatch]);

    // Khi posts đã có, gọi lấy like
    useEffect(() => {
        if (posts.length > 0) {
            const ids = posts.map((post) => post._id);
            dispatch(fetchLikeCounts(ids));
            dispatch(fetchUserLikedPosts());
            dispatch(getCommentCountsByPosts(ids));
        }
    }, [dispatch, posts]);

    useEffect(() => {
        commentSocket.on("newComment", ({ postId }) => {
            dispatch(getCommentCountsByPosts([postId]));
        });

        return () => {
            commentSocket.off("newComment"); // Cleanup khi component bị unmount
        };
    }, [dispatch]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (inputRef.current && !inputRef.current.contains(event.target as Node)) {
                if (!postContent.trim()) setIsExpanded(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [postContent]);

    const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        setMediaFiles((prev) => [...prev, ...files]);
    };

    const convertToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
        });
    };

    const handleCreatePost = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                alert("You are not logged in!");
                return;
            }

            setIsPosting(true);
            const base64Media = await Promise.all(mediaFiles.map(convertToBase64));
            console.log("asdd");
            
            await dispatch(createPost({
                content: postContent,
                media: base64Media.length ? base64Media : undefined,
            })).unwrap();
            console.log("Post created successfullyzzz");
            
            await dispatch(fetchAllPosts());
            setPostContent("");
            setMediaFiles([]);
            setIsExpanded(false);

            console.log("Post created successfullyttttttttttttt");
            
        } catch (err) {
            alert("Posting failed: " + err);
        } finally {
            setIsPosting(false);
        }
    }; 
    
    const filteredPosts = posts.filter((post) => {
        const contentMatch = post.content?.toLowerCase().includes(searchTerm.toLowerCase());
        const usernameMatch = post.username?.toLowerCase().includes(searchTerm.toLowerCase());
        return contentMatch || usernameMatch;
    });
    

    return (
        <main className="bg-zinc-900 text-white min-h-screen">
            <div className="p-4 flex items-center gap-3">
                <div className="flex-1">
                    <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
                </div>
                <button
                    onClick={() => setIsExpanded(true)}
                    className="bg-zinc-700 hover:bg-zinc-600 w-10 h-10 flex items-center justify-center rounded-full"
                >
                    <Plus size={22} />
                </button>
            </div>

            <div
                ref={inputRef}
                className={`p-4 bg-zinc-800 rounded-2xl transition-all duration-300 mt-4 mx-4 ${isExpanded ? "h-auto" : "h-16"
                    } flex flex-col gap-3`}
            >
                <div className="flex items-start gap-4">
                    <img
                        src={userDetail?.avatar || "https://picsum.photos/200"}
                        alt="Avatar"
                        className="w-10 h-10 rounded-full object-cover"
                    />
                    <div className="flex-1">
                        <textarea
                            placeholder="Start a post..."
                            className="w-full bg-transparent text-lg placeholder:text-zinc-500 focus:outline-none text-zinc-200 resize-none overflow-hidden"
                            style={{ minHeight: "40px" }}
                            rows={isExpanded ? 3 : 1}
                            onFocus={() => setIsExpanded(true)}
                            value={postContent}
                            onChange={(e) => setPostContent(e.target.value)}
                        />
                        {mediaFiles.length > 0 && (
                            <div className="mt-2 grid grid-cols-2 gap-2 max-w-full">
                                {mediaFiles.map((file, index) => (
                                    <div key={index} className="relative w-full max-w-sm">
                                        <button
                                            onClick={() =>
                                                setMediaFiles((prev) => prev.filter((_, i) => i !== index))
                                            }
                                            className="absolute top-2 right-2 bg-black/60 text-white rounded-full px-2 py-1 text-sm z-10 hover:bg-black/80 cursor-pointer"
                                        >
                                            <X size={16} />
                                        </button>

                                        {file.type.startsWith("image/") ? (
                                            <img
                                                src={URL.createObjectURL(file)}
                                                alt={`media-${index}`}
                                                className="w-full max-h-80 object-cover rounded"
                                            />
                                        ) : (
                                            <video
                                                src={URL.createObjectURL(file)}
                                                controls
                                                className="w-full max-h-80 object-cover rounded"
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {isExpanded && (
                    <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2">
                            <button
                                className="flex items-center justify-center bg-zinc-700 hover:bg-zinc-600 p-2 rounded-lg transition cursor-pointer"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Image size={20} className="text-white" />
                            </button>
                            <input
                                type="file"
                                accept="image/*,video/*"
                                className="hidden"
                                ref={fileInputRef}
                                onChange={handleMediaSelect}
                                multiple
                            />
                            <div className="flex items-center gap-2 bg-zinc-700 hover:bg-zinc-600 px-3 py-2 rounded-lg text-white cursor-pointer">
                                <div className="w-3 h-3 bg-pink-500 rounded-full"></div>
                                <span>Beauty</span>
                                <ChevronDown size={16} />
                            </div>
                        </div>
                        <button
                            className={`px-5 py-2 rounded-3xl transition ${postContent.trim() && !isPosting
                                ? "bg-green-500 hover:bg-green-400 text-white cursor-pointer"
                                : "bg-zinc-600 text-white opacity-50 cursor-not-allowed"
                                }`}
                            disabled={!postContent.trim() || isPosting}
                            onClick={handleCreatePost}
                        >
                            {isPosting ? "Posting..." : "Post"}
                        </button>
                    </div>
                )}
            </div>

            <div className="mt-4 mx-4 max-h-[70vh] overflow-y-auto scrollbar-dark rounded-2xl">
                {loading && <p className="text-center text-zinc-400">Loading posts...</p>}
                {error && <p className="text-center text-red-500">Error: {error}</p>}
                {!loading && !error && (
                    filteredPosts.map((post) => (
                        <Posts
                            posts={filteredPosts}
                            username={post.username || "Ẩn danh"}
                            avatar={post.avatar || "https://picsum.photos/200"}
                            commentCounts={commentCounts}
                        />

                    ))
                )}
            </div>

        </main>
    );
};

export default MainContent;
