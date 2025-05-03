import { Search } from "lucide-react";

interface SearchBarProps {
    searchTerm: string;
    setSearchTerm: (value: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ searchTerm, setSearchTerm }) => {
    return (
        <div className="relative flex-1">
            <input
                type="text"
                placeholder="Search posts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-3 pl-10 bg-zinc-800 rounded-3xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-600 transition"
            />
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-500" />
        </div>
    );
};

export default SearchBar;