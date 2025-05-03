import { useState, useEffect } from "react";
import { ArrowLeft, Camera, Save, Trash2, User, AtSign, Pencil, CircleCheck, PhoneCallIcon, CalendarDays, CircleUser } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSelector } from 'react-redux';
import { RootState } from '../../redux/store';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../redux/store';
import { updateUserDetail, getUserDetails } from '../../redux/slice/userSlice';
import { getUserProfile } from '../../redux/slice/authSlice';
interface ProfileFormData {
    phoneNumber: string;
    email: string;
    firstName: string;
    lastName: string;
    username: string;
    bio: string;
    dob: string;
}

export default function EditProfile() {
    const userDetail = useSelector((state: RootState) => state.auth.userDetail); // Lấy userDetail từ Redux
    const navigate = useNavigate();
    const dispatch = useDispatch<AppDispatch>();


    const [formData, setFormData] = useState<ProfileFormData>({
        phoneNumber: "",
        email: "",
        firstName: "",
        lastName: "",
        username: "",
        bio: "",
        dob: "",

    });

    const [backgroundImage, setBackgroundImage] = useState<string>("");
    const [avatarImage, setAvatarImage] = useState<string>("");

    // Khi userDetail thay đổi, cập nhật lại backgroundImage và avatarImage
    useEffect(() => {
        if (userDetail) {
            const formattedDob = userDetail.DOB
                ? new Date(userDetail.DOB).toISOString().split('T')[0]  // ISO date yyyy-mm-dd
                : "";
            setFormData({
                phoneNumber: userDetail.phoneNumber || "", // Thêm trường phoneNumber vào formData
                email: userDetail.email || "",
                firstName: userDetail.firstname || "",
                lastName: userDetail.lastname || "",
                username: userDetail.username || "",
                bio: userDetail.bio || "",
                dob: formattedDob,
            });

            setBackgroundImage(userDetail.backgroundAvatar);
            setAvatarImage(userDetail.avatar);
        }
    }, [userDetail]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    // const handleSave = () => {
    //     console.log("Saving profile:", formData);
    //     alert("Profile saved successfully!");
    // };
    const handleSave = () => {
        if (!userDetail?._id) {
            alert("User ID not found.");
            return;
        }

        const dataToSend = {
            id: userDetail.userId,
            firstname: formData.firstName,
            lastname: formData.lastName,
            username: formData.username,
            bio: formData.bio,
            dob: formData.dob,
            avatar: avatarImage,
            backgroundAvatar: backgroundImage
        };

        dispatch(updateUserDetail(dataToSend))
            .unwrap()
            .then(() => {

                const token = localStorage.getItem("token");
                if (token) {
                    dispatch(getUserProfile(token)); // ⬅️ Load lại userDetail dùng trong Sidebar
                }
                dispatch(getUserDetails(userDetail.userId))
                    .then(() => {
                        alert("Profile saved successfully!");
                    });
            })
            .catch((err) => {
                console.error("Update failed:", err);
                alert("Failed to update profile.");
            });
    };

    // Handle background image change
    const handleBackgroundChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                if (reader.result) {
                    setBackgroundImage(reader.result as string);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    // Handle avatar image change
    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                if (reader.result) {
                    setAvatarImage(reader.result as string);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    // Hàm quay lại trang My Profile khi nhấn vào nút quay lại
    const handleBack = () => {
        navigate("/home/my-profile"); // Điều hướng về trang /my-profile
    };

    return (
        <div className="flex-1 bg-[#1F1F1F] text-white">
            {/* Header */}
            <div
                className="relative w-full h-48 bg-cover bg-center"
                style={{ backgroundImage: `url(${backgroundImage})` }}
            >
                <div className="absolute inset-0 bg-black/50" />
                <div className="absolute top-4 left-4 flex items-center gap-2">
                    <button className="p-3 rounded-full text-white hover:bg-white/20 transition cursor-pointer" onClick={handleBack}>
                        <ArrowLeft size={28} />
                    </button>
                </div>
                <div className="absolute top-4 right-4 flex items-center gap-2">
                    <button className="p-3 rounded-full text-white hover:bg-white/20 transition cursor-pointer">
                        <Trash2 size={22} />
                    </button>
                    {/* Change Background Image */}
                    <label htmlFor="background-image" className="p-3 rounded-full text-white hover:bg-white/20 transition cursor-pointer">
                        <Camera size={22} />
                    </label>
                    <input
                        id="background-image"
                        type="file"
                        accept="image/*"
                        onChange={handleBackgroundChange}
                        className="hidden"
                    />
                    <button onClick={handleSave} className="px-4 py-2 text-white hover:bg-white/20 rounded-md transition flex items-center gap-2 cursor-pointer">
                        <Save size={18} />
                    </button>
                </div>
                {/* Avatar */}
                <div className="absolute -bottom-16 left-6">
                    <div className="relative">
                        <img
                            src={avatarImage}
                            alt="Profile"
                            className="w-24 h-24 rounded-full border-4 border-[#1F1F1F] bg-zinc-800"
                        />
                        <label htmlFor="avatar-image" className="absolute bottom-0 right-0 rounded-full bg-zinc-800 p-2 text-white hover:bg-zinc-700 transition cursor-pointer">
                            <Camera size={18} />
                        </label>
                        {/* Input file để thay đổi avatar */}
                        <input
                            id="avatar-image"
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarChange}
                            className="hidden"
                        />
                    </div>
                </div>

            </div>

            {/* Form chỉnh sửa */}
            <div className="container mx-auto px-4 pt-20 max-w-3xl">
                <h3 className="text-sm font-semibold text-zinc-500 uppercase mb-4 text-left">Edit Profile</h3>

                <div className="bg-[#181818] p-6 rounded-lg shadow-md space-y-4">
                    {/* Các field cơ bản */}
                    {[
                        { label: "Phone Number", name: "phoneNumber", type: "text", icon: <PhoneCallIcon size={18} />, readonly: true },
                        { label: "Email", name: "email", type: "text", icon: <AtSign size={18} />, readonly: true },
                        { label: "Username", name: "username", type: "text", icon: <CircleUser size={18} /> },
                    ].map(({ label, name, type, icon, readonly }) => (
                        <div key={name} className="flex items-center gap-4 border-b border-zinc-700 pb-4">
                            <div className="flex items-center gap-2 text-zinc-400 w-1/3">
                                {icon}
                                <label className="text-sm">{label}</label>
                            </div>
                            <div className="w-2/3 flex items-center gap-2">
                                <input
                                    id={name}
                                    name={name}
                                    type={type}
                                    value={formData[name as keyof ProfileFormData]}
                                    onChange={handleChange}
                                    className={`w-full bg-transparent text-white border border-white/30 px-3 py-2 rounded-md outline-none 
            focus:border-[#00FF7F] focus:ring-1 focus:ring-[#00FF7F] 
            ${name === "dob" ? "[&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:hue-rotate-90" : ""}`}
                                    readOnly={readonly}
                                />
                                <CircleCheck size={20} className="text-[#00FF7F]" />
                            </div>
                        </div>
                    ))}

                    {/* Họ tên gộp lại sau Username */}
                    <div className="flex items-center gap-4 border-b border-zinc-700 pb-4">
                        <div className="flex items-center gap-2 text-zinc-400 w-1/3">
                            <User size={18} />
                            <label className="text-sm">Full Name</label>
                        </div>
                        <div className="w-2/3 flex gap-2">
                            <input
                                id="firstName"
                                name="firstName"
                                type="text"
                                value={formData.firstName}
                                onChange={handleChange}
                                placeholder="First name"
                                className="w-1/2 bg-transparent text-white border border-white/30 px-3 py-2 rounded-md outline-none focus:border-[#00FF7F] focus:ring-1 focus:ring-[#00FF7F]"
                            />
                            <input
                                id="lastName"
                                name="lastName"
                                type="text"
                                value={formData.lastName}
                                onChange={handleChange}
                                placeholder="Last name"
                                className="w-1/2 bg-transparent text-white border border-white/30 px-3 py-2 rounded-md outline-none focus:border-[#00FF7F] focus:ring-1 focus:ring-[#00FF7F]"
                            />
                        </div>
                    </div>

                    {/* Ngày sinh và Bio */}
                    {[
                        { label: "Date of Birth", name: "dob", type: "date", icon: <CalendarDays size={18} /> },
                        { label: "Bio", name: "bio", type: "text", icon: <Pencil size={18} /> },
                    ].map(({ label, name, type, icon }) => (
                        <div key={name} className="flex items-center gap-4 border-b border-zinc-700 pb-4">
                            <div className="flex items-center gap-2 text-zinc-400 w-1/3">
                                {icon}
                                <label className="text-sm">{label}</label>
                            </div>
                            <div className="w-2/3 flex items-center gap-2">
                                <input
                                    id={name}
                                    name={name}
                                    type={type}
                                    value={formData[name as keyof ProfileFormData]}
                                    onChange={handleChange}
                                    className={`w-full bg-transparent text-white border border-white/30 px-3 py-2 rounded-md outline-none 
            focus:border-[#00FF7F] focus:ring-1 focus:ring-[#00FF7F] 
            ${name === "dob" ? "[&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:hue-rotate-90" : ""}`}
                                />
                                <CircleCheck size={20} className="text-[#00FF7F]" />
                            </div>
                        </div>
                    ))}
                </div>



            </div>
        </div>
    );
}
