import Sidebar from "../components/Sidebar";
import MainContent from "../components/MainContent";
import MyProfile from "./profile/MyProfile";
import RightSidebar from "../components/RightSidebar";
import Message from "./message/Message";
import EditProfile from "./profile/EditProfile";
import Explore from "./explore/Explore";
import Setting from "./setting/AccountSettings";
import Notification from "./notification/Notification";
import UserInfo_Follow from "./userInfor_Follow/UserInfo_Follow";
import { Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { getUserProfile} from '../redux/slice/authSlice';
import {  AppDispatch } from '../redux/store';
import { useDispatch } from 'react-redux';
const Home = () => {
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();
  const isHiddenRightSidebar = location.pathname === "/home/message" || location.pathname === "/home/setting";
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      dispatch(getUserProfile(token));
    }
  }, [dispatch]);
  return (
    <div className="flex bg-[#1F1F1F] text-white min-h-screen">
      {/* Sidebar cố định */}
      <Sidebar />

      <div className="flex-1 ml-72 overflow-auto">
        <Routes>
          <Route path="/" element={<MainContent />} />
          <Route path="/my-profile" element={<MyProfile />} />
          <Route path="/edit-profile" element={<EditProfile />} />
          <Route path="/message" element={<Message />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/setting" element={<Setting />} />
          <Route path="/notifications" element={<Notification />} />
          <Route path="/user-info/:id" element={<UserInfo_Follow />} />
        </Routes>
      </div>

      {/* Right Sidebar chỉ hiển thị nếu không phải trang Message */}
      {!isHiddenRightSidebar && <RightSidebar />}
      </div>
  );
};

export default Home;
