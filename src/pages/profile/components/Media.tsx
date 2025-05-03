import { useSelector } from "react-redux";
import { RootState } from "../../../redux/store";
import { useState } from "react";
import ImageModal from "../components/ImageModal";

const Media = () => {
    const { posts } = useSelector((state: RootState) => state.postProfile);
    const userDetail = useSelector((state: RootState) => state.auth.userDetail);

    const [modalOpen, setModalOpen] = useState(false);
    const [modalMediaList, setModalMediaList] = useState<string[]>([]);
    const [modalStartIndex, setModalStartIndex] = useState(0);
    const [modalPostContent, setModalPostContent] = useState("");
    const [modalUsername, setModalUsername] = useState("");
    const [modalAvatar, setModalAvatar] = useState("");
    const [modalPostId, setModalPostId] = useState("");

    const handleOpenModal = (mediaList: string[], index: number, content: string, postId: string) => {
        setModalMediaList(mediaList);
        setModalStartIndex(index);
        setModalPostContent(content);
        setModalUsername(`${userDetail?.firstname} ${userDetail?.lastname}`);
        setModalAvatar(userDetail?.avatar || "");
        setModalPostId(postId);
        setModalOpen(true);
    };

    // 👉 Tạo danh sách media từ các bài post
    const allMedia = posts.flatMap(post =>
        (post.media || []).map((src: string, idx: number) => ({
            src,
            mediaList: post.media,
            content: post.content,
            index: idx,
            postId: post._id,
        }))
    );

    return (
        <div className="relative">
            <div className="p-4 grid grid-cols-3 gap-2">
                {allMedia.length === 0 ? (
                    <p className="text-center text-zinc-400 col-span-3">
                        No media has been posted yet.
                    </p>
                ) : (
                    allMedia.map((item, i) => (
                        <div
                            key={`${item.src}-${i}`}
                            className="relative w-full rounded-lg overflow-hidden aspect-[16/9] bg-black cursor-pointer"
                            onClick={() => handleOpenModal(item.mediaList || [], item.index, item.content, item.postId)}
                        >
                            {item.src.includes("video") || item.src.includes(".mp4") ? (
                                <video
                                    className="w-full h-full object-cover pointer-events-none"
                                    muted
                                    preload="metadata"
                                >
                                    <source src={item.src} type="video/mp4" />
                                </video>
                            ) : (
                                <img
                                    src={item.src}
                                    alt={`media-${i}`}
                                    className="w-full h-full object-cover"
                                />
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Modal hiển thị ảnh hoặc video */}
            <ImageModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                mediaList={modalMediaList}
                startIndex={modalStartIndex}
                content={modalPostContent}
                username={modalUsername}
                avatar={modalAvatar}
                postId={modalPostId}
            />
        </div>
    );
};

export default Media;