interface CategoryFilterProps {
    categories: string[];
    activeCategory: string;
    setActiveCategory: (category: string) => void;
}

const CategoryFilter: React.FC<CategoryFilterProps> = ({ categories, activeCategory, setActiveCategory }) => {
    return (
        <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map((category) => (
                <button
                    key={category}
                    onClick={() => setActiveCategory(category)}
                    className={`px-4 py-2 rounded-full transition ${
                        activeCategory === category ? "bg-white text-black" : "bg-zinc-700 text-white"
                    }`}
                >
                    {category}
                </button>
            ))}
        </div>
    );
};

export default CategoryFilter;