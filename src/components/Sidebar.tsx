import type React from "react";
import { Home, Bell, MessageSquare, Bookmark, User, LayoutDashboard, MoreHorizontal, Settings, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Columns2, ChevronRight } from "lucide-react";
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../redux/store';
import { logout } from '../redux/slice/authSlice';

import { AppDispatch } from "../redux/store"; // Import AppDispatch
import { fetchUnreadCount } from "../redux/slice/notificationSlice"; // Import action fetchUnreadCount



const Sidebar = () => {
    // const dispatch = useDispatch();
    const dispatch = useDispatch<AppDispatch>();
    const [showSidebar, setShowSidebar] = useState(true);
    const navigate = useNavigate();
    const [showMenu, setShowMenu] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const userDetail = useSelector((state: RootState) => state.auth.userDetail); 
    const unreadCount = useSelector((state: RootState) => state.notification.unreadCount); // Lấy số lượng thông báo chưa đọc từ Redux
   
    const getInitialActiveItem = () => {
        const item = localStorage.getItem("activeItem");
        const validItems = ["Home", "Notifications", "Messages", "Bookmarks", "My Profile", "Explore"];
        return validItems.includes(item || "") ? item : "Home";
    };

    const [activeItem, setActiveItem] = useState(getInitialActiveItem);
    useEffect(() => {
        // Gọi fetchUnreadCount khi Sidebar render lần đầu tiên
        dispatch(fetchUnreadCount());
    }, [dispatch]);

    useEffect(() => {
        const handleStorageChange = () => {
            setActiveItem(localStorage.getItem("activeItem") || "Home");
        };

        window.addEventListener("storage", handleStorageChange);
        return () => {
            window.removeEventListener("storage", handleStorageChange);
        };
    }, []);

    const handleNavigation = (label: string, path: string) => {
        setActiveItem(label); // Set the active item
        localStorage.setItem("activeItem", label); // Store in localStorage
        navigate(path); // Navigate to the correct path
    };

    const toggleSidebar = () => {
        setShowSidebar(prev => !prev); // Toggle trạng thái sidebar
    };

    return (
        <aside
            className={`fixed top-0 left-0 h-screen ${showSidebar ? 'w-72' : 'w-20'} bg-[#1F1F1F] text-white p-3 flex flex-col justify-between border-r border-zinc-800 transition-all duration-300`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div>
                <a href="/home" className={`text-[#00FF7F] ${showSidebar ? 'text-3xl' : 'text-sm'} font-bold`}>
                    PULSE
                </a>
                <nav className="mt-8 flex flex-col space-y-1">
                    <SidebarItem icon={<Home size={24} />} label="Home" active={activeItem === "Home"} navigate={() => handleNavigation("Home", "/home")} showSidebar={showSidebar} />
                    <SidebarItem icon={<Bell size={24} />} label="Notifications" active={activeItem === "Notifications"} navigate={() => handleNavigation("Notifications", "/home/notifications")} showSidebar={showSidebar} unreadCount={unreadCount} />
                    <SidebarItem icon={<MessageSquare size={24} />} label="Messages" active={activeItem === "Messages"} navigate={() => handleNavigation("Messages", "/home/message")} showSidebar={showSidebar} />
                    <SidebarItem icon={<Bookmark size={24} />} label="Bookmarks" active={activeItem === "Bookmarks"} navigate={() => handleNavigation("Bookmarks", "/home/bookmarks")} showSidebar={showSidebar} />
                    <SidebarItem icon={<User size={24} />} label="My Profile" active={activeItem === "My Profile"} navigate={() => handleNavigation("My Profile", "/home/my-profile")} showSidebar={showSidebar} />
                    <SidebarItem icon={<LayoutDashboard size={24} />} label="Explore" active={activeItem === "Explore"} navigate={() => handleNavigation("Explore", "/home/explore")} showSidebar={showSidebar} />
                </nav>
            </div>

            {/* Footer với avatar + 3 chấm */}
            <div className="flex items-center justify-between gap-2 p-4 pl-2 ">
                <div
                    onClick={() => navigate("/home/my-profile")}
                    className="flex items-center gap-2 p-2 pl-0 cursor-pointer rounded-xl transition"
                >
                    <img
                        src={userDetail?.avatar}
                        alt="Profile"
                        className="w-11 h-11 rounded-full object-cover ml-2"
                    />
                    {showSidebar && (
                        <div className="flex flex-col ml-1 overflow-hidden">
                            <span className="text-white font-semibold text-sm truncate">
                                {userDetail?.firstname} {userDetail?.lastname}
                            </span>
                            <span className="text-zinc-400 text-xs truncate">@{userDetail?.username}</span>
                        </div>
                    )}
                </div>

                {showSidebar && (
                    <div className="relative ml-auto">
                        <button onClick={() => setShowMenu(!showMenu)} className="text-zinc-400 hover:text-white cursor-pointer">
                            <MoreHorizontal size={30} />
                        </button>
                        {showMenu && (
                            <div className="absolute right-0 bottom-[45px] w-15 flex flex-col items-center p-2 rounded-xl bg-zinc-800 shadow-md z-50">
                                <button className="p-2 text-sm text-zinc-400 hover:text-white cursor-pointer" onClick={() => navigate("/home/setting")}><Settings size={18} /></button>
                                <button className="p-2 text-sm text-red-400 hover:text-red-300 cursor-pointer" onClick={() => {
                                    localStorage.removeItem("activeItem");
                                    dispatch(logout());
                                    navigate("/");
                                }}><LogOut size={18} /></button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Nút toggle thu/phóng sidebar */}
            <button
                className={`cursor-pointer absolute top-4 right-1 text-lg transition duration-200 ${isHovered || showSidebar ? 'text-green-400' : 'text-white hover:text-gray-400'}`}
                onClick={toggleSidebar}
            >
                {showSidebar ? <Columns2 size={20} /> : <ChevronRight size={20} />}
            </button>
        </aside>
    );
};
const SidebarItem = ({
    icon,
    label,
    active,
    navigate,
    showSidebar,
    unreadCount
}: {
    icon: React.ReactNode;
    label: string;
    active?: boolean;
    navigate: () => void;
    showSidebar: boolean;
    unreadCount?: number;
}) => {
    return (
        <button
            className={`flex items-center space-x-4 p-3 rounded-2xl w-full transition cursor-pointer 
                ${active ? "font-semibold bg-zinc-700" : "text-zinc-400 hover:bg-zinc-800"}`}
            onClick={navigate}
        >
            {icon}
            {showSidebar && <span className="text-lg">{label}</span>}
            {(label === "Notifications" || label === "Messages") && (unreadCount ?? 0) > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs px-2 rounded-full">{unreadCount}</span>
            )}
        </button>
    );
};

export default Sidebar;
