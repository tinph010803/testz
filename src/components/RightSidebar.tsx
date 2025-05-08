import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../redux/store";
import { getTopUsersExcludingFollowed } from "../redux/slice/userSlice";
import { getFollowings, getFollowers } from "../redux/slice/followSlice";
import { motion } from "framer-motion";

interface User {
  _id: string;
  firstname: string;
  lastname: string;
  avatar: string;
  username: string;
}

const RightSidebar = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [activeTab, setActiveTab] = useState("whoToFollow");
  const navigate = useNavigate();

  const userState = useSelector((state: RootState) => state.user);
  const top10Users = (userState as RootState["user"] & { top10Users: User[] }).top10Users;
  const authUser = useSelector((state: RootState) => state.auth.user);
  const loading = userState.loading;
  const error = userState.error;
  const followState = useSelector((state: RootState) => state.follow);
  const followings = followState.followings;

  useEffect(() => {
    if (authUser?._id) {
      dispatch(getTopUsersExcludingFollowed(authUser._id));
      dispatch(getFollowings(authUser._id));
      dispatch(getFollowers(authUser._id));
    }
  }, [authUser?._id, dispatch]);

  const handleUserClick = (id: string) => {
    navigate(`/home/user-info/${id}`);
  };

  return (
    <aside className="w-80 p-4 bg-[#1F1F1F] text-white border-l border-zinc-800">
      {/* Tabs */}
      <div className="flex justify-between mb-4 bg-[#191919] p-1 rounded-full relative">
        <div
          className={`absolute top-0 left-0 h-full w-1/2 bg-[#292929] rounded-full transition-all duration-300 ${activeTab === "trendingPosts" ? "translate-x-full" : "translate-x-0"
            }`}
        ></div>
        <button
          className={`relative px-3 py-1.5 w-1/2 font-semibold text-white transition cursor-pointer ${activeTab === "whoToFollow" ? "font-bold" : "text-gray-400"
            }`}
          onClick={() => setActiveTab("whoToFollow")}
        >
          Who to follow
        </button>
        <button
          className={`relative px-4 py-1.5 w-1/2 font-semibold text-white transition cursor-pointer ${activeTab === "trendingPosts" ? "font-bold" : "text-gray-400"
            }`}
          onClick={() => setActiveTab("trendingPosts")}
        >
          Followings
        </button>
      </div>

      {/* Content */}
      <div className="space-y-4 max-h-[calc(100vh-100px)] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-zinc-900">
        {activeTab === "whoToFollow" && (
          loading ? (
            <p>Loading...</p>
          ) : error ? (
            <div className="flex flex-col items-center justify-center mt-10 text-center text-zinc-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-20 h-20 text-zinc-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 14c2.21 0 4 1.79 4 4v1H4v-1c0-2.21 1.79-4 4-4m8-6a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <p className="text-lg font-medium">All users have been tracked.</p>
              <p className="text-sm text-zinc-500 mt-1">Please try again later.</p>
            </div>
          ) : top10Users.length > 0 ? (
            top10Users.map((user: User) => {
              const fullName = `${user.firstname} ${user.lastname}`;
              return (
                <div
                  key={user._id}
                  className="bg-[#282828] p-3 rounded-lg flex items-center gap-3 cursor-pointer hover:bg-[#333] transition"
                  onClick={() => handleUserClick(user._id)}
                >
                  <img
                    src={user.avatar}
                    alt={fullName}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                  <div>
                    <h4 className="font-medium">{fullName}</h4>
                    <p className="text-zinc-500 text-sm">@{user.username}</p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center mt-10 text-center text-zinc-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-20 h-20 text-zinc-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 14c2.21 0 4 1.79 4 4v1H4v-1c0-2.21 1.79-4 4-4m8-6a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <p className="text-lg font-medium">All users have been tracked!</p>
            </div>
          )
        )}

        {activeTab === "trendingPosts" && (
          <motion.div
            key="trendingPosts"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
          >
            {followState.loading ? (
              <p>Loading...</p>
            ) : followings.length === 0 ? (
              <div className="flex flex-col items-center justify-center mt-10 text-center text-zinc-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-20 h-20 text-zinc-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 14c2.21 0 4 1.79 4 4v1H4v-1c0-2.21 1.79-4 4-4m8-6a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <p className="text-lg font-medium">No followings!</p>
            </div>
            ) : (
              followings.map((item) => {
                const fullName = `${item.user.firstname} ${item.user.lastname}`;
                return (
                  <div
                    key={item._id}
                    className="bg-[#282828] p-3 rounded-lg flex items-center gap-3 cursor-pointer hover:bg-[#333] transition"
                    onClick={() => handleUserClick(item.user._id)}
                  >
                    <img
                      src={item.user.avatar}
                      alt={fullName}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                    <div>
                      <h4 className="font-medium">{fullName}</h4>
                      <p className="text-zinc-500 text-sm">@{item.user.username}</p>
                    </div>
                  </div>
                );
              })
            )}
          </motion.div>
        )}
      </div>
    </aside>
  );
};

export default RightSidebar;
