const Media = () => {
    // Danh sách ảnh (mô phỏng từ link picsum.photos)
    const images = Array.from({ length: 20 }, (_, index) => `https://picsum.photos/200?random=${index}`);

    return (
        <div className="p-4 grid grid-cols-3 gap-2">
            {images.map((src, index) => (
                <img 
                    key={index}
                    src={src} 
                    alt={`media-${index}`} 
                    className="w-full h-auto rounded-lg object-cover"
                />
            ))}
        </div>
    );
};

export default Media;
