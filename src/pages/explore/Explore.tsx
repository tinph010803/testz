import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PostCard,CategoryFilter,SearchBar } from "./components";

interface Post {
    image: string;
    title: string;
    user: string;
    avatar: string;
    category: string;
}

const Explore: React.FC = () => {
    const navigate = useNavigate();
    const [activeCategory, setActiveCategory] = useState<string>("All");
    const [searchTerm, setSearchTerm] = useState<string>("");

    const categories: string[] = ["All", "Beauty", "Food", "Photography", "Travel"];

    const posts: Post[] = [
        { image: "https://picsum.photos/300/200", title: "hello", user: "200Lab Guest", avatar: "https://i.pravatar.cc/300", category: "Food" },
        { image: "https://picsum.photos/301/200", title: "Vietnam Adventure", user: "Chi Hướng", avatar: "https://i.pravatar.cc/301", category: "Photography" },
        { image: "https://picsum.photos/302/200", title: "Gaming World", user: "Binh Pham", avatar: "https://i.pravatar.cc/302", category: "Food" },
        { image: "https://picsum.photos/303/200", title: "Beauty Trends 2025", user: "John Doe2", avatar: "https://i.pravatar.cc/303", category: "Beauty" },
        { image: "https://picsum.photos/304/200", title: "Delicious Street Food", user: "Minh Tran", avatar: "https://i.pravatar.cc/304", category: "Food" },
        { image: "https://picsum.photos/305/200", title: "Hidden Travel Gems", user: "Lisa Nguyen", avatar: "https://i.pravatar.cc/305", category: "Travel" },
    ];

    const filteredPosts = posts.filter(post =>
        (activeCategory === "All" || post.category === activeCategory) &&
        post.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <main className="flex-1 bg-[#1F1F1F] text-white p-4">
            <div className="flex items-center gap-4 mb-4">
                <button onClick={() => navigate("/home")} className="text-zinc-400 hover:text-white">
                    <ArrowLeft size={24} />
                </button>
                <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
            </div>

            <CategoryFilter categories={categories} activeCategory={activeCategory} setActiveCategory={setActiveCategory} />

            <div className="grid grid-cols-2 gap-4 mt-4">
                {filteredPosts.length > 0 ? (
                    filteredPosts.map((post, index) => <PostCard key={index} post={post} />)
                ) : (
                    <p className="text-center text-zinc-400 col-span-2">No posts found.</p>
                )}
            </div>
        </main>
    );
};

export default Explore;
