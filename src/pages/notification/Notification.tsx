import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { getUserDetailsByIds } from "../../redux/slice/userSlice";
import {
  Notification as NotificationType,
  markNotificationAsRead,
  markMultipleNotificationsAsRead,
  fetchUnreadCount,
} from "../../redux/slice/notificationSlice";
import type { AppDispatch } from "../../redux/store";


const Notification = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>(); // Sử dụng AppDispatch cho dispatch
  const { notifications, loading, error } = useSelector((state: RootState) => state.notification);
  const userId = useSelector((state: RootState) => state.auth.user?._id);

  const [filter, setFilter] = useState<"all" | "message" | "like" | "comment" | "follow">("all");
  const [filteredNotifications, setFilteredNotifications] = useState<NotificationType[]>([]);
  const [senderMap, setSenderMap] = useState<
    Record<string, { firstname: string; lastname: string; avatar: string }>
  >({});

  useEffect(() => {
    if (filter === "all") {
      setFilteredNotifications(notifications);
    } else {
      setFilteredNotifications(notifications.filter(n => n.type === filter));
    }
  }, [filter, notifications]);

  // useEffect(() => {
  //    dispatch(fetchRecentNotifications());
  // },  [dispatch]);
  
  useEffect(() => {
    const fetchSenderInfo = async () => {
      const senderIds = [...new Set(notifications.map((n) => n.senderId))];
      if (senderIds.length === 0) return;

      try {
        const res: any = await dispatch(getUserDetailsByIds(senderIds));
        if (res.payload && Array.isArray(res.payload)) {
          const map: Record<string, { firstname: string; lastname: string; avatar: string }> = {};
          res.payload.forEach((user: any) => {
            map[user.userId] = {
              firstname: user.firstname,
              lastname: user.lastname,
              avatar: user.avatar,
            };
          });
          setSenderMap(map);
        }
      } catch (err) {
        console.error("❌ Lỗi khi gọi getUserDetailsByIds từ Redux:", err);
      }
    };

    fetchSenderInfo();
  }, [notifications, dispatch]);

  const handleBack = () => navigate(-1);

  return (
    <div className="relative h-screen">
      <div className="absolute inset-0 bg-black/50 z-0" />

      <main className="relative z-10 p-4 text-white h-full overflow-y-auto">
        <div className="flex items-center gap-2 mb-4">
          <button
            className="p-3 rounded-full text-white hover:bg-white/20 transition cursor-pointer"
            onClick={handleBack}
          >
            <ArrowLeft size={28} />
          </button>
          <h1 className="text-2xl font-bold">Notifications</h1>
        </div>

        <div className="bg-zinc-900 p-4 rounded-lg shadow-lg flex items-center justify-between">
          <div className="flex gap-4">
            {["all", "message", "like", "comment", "follow"].map((type) => (
              <button
                key={type}
                onClick={() => setFilter(type as any)}
                className={`px-4 py-2 rounded-lg transition font-semibold focus:outline-none ${filter === type ? "bg-white text-black" : "text-gray-400 hover:bg-white/10 cursor-pointer"
                  }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
          <button
            className="text-sm text-gray-300 hover:underline cursor-pointer"
            onClick={async () => {
              let ids: string[] = [];
              if (filter === "all") {
                ids = notifications.filter(n => !n.isRead).map(n => n._id);
              } else {
                ids = notifications.filter(n => !n.isRead && n.type === filter).map(n => n._id);
              }
              if (ids.length > 0 && userId) {
                // Đánh dấu nhiều thông báo là đã đọc
                await dispatch(markMultipleNotificationsAsRead({ ids, userId }));

                // Sau khi đánh dấu, cập nhật số lượng thông báo chưa đọc
                await dispatch(fetchUnreadCount()); // Cập nhật số lượng thông báo chưa đọc
              }
            }}
          >
            Read all
          </button>
        </div>

        <div className="mt-4 space-y-4">
          {loading ? (
            <p className="text-center text-gray-400">Loading notifications...</p>
          ) : error ? (
            <p className="text-center text-red-500">Error: {error}</p>
          ) : filteredNotifications.length > 0 ? (
            filteredNotifications.map((notification) => (
              <div
                key={notification._id}
                className="p-4 border-b border-zinc-800 flex items-start gap-4 cursor-pointer hover:bg-white/5 transition"
                onClick={async () => {
                  if (!notification.isRead && userId) {
                    await dispatch(markNotificationAsRead({ id: notification._id, userId }));
                  }

                  if (notification.type === "follow") {
                    navigate(`/home/user-info/${notification.senderId}`);
                  } else {
                    navigate(`/home/user-info/${notification.senderId}`);
                  }
                }}
              >
                {senderMap[notification.senderId]?.avatar ? (
                  <img
                    src={senderMap[notification.senderId].avatar}
                    alt="avatar"
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-white text-sm uppercase">
                    {senderMap[notification.senderId]?.firstname.charAt(0) || "?"}
                  </div>
                )}

                <div className="flex-1">
                  <p className="mb-1">
                    <strong>
                      {senderMap[notification.senderId]
                        ? `${senderMap[notification.senderId].firstname} ${senderMap[notification.senderId].lastname}`
                        : notification.senderId}
                    </strong>{" "}
                    {notification.type === "like" && (
                      <span className="text-blue-400">❤️ liked your post</span>
                    )}
                    {notification.type === "comment" && (
                      <span className="text-yellow-400">💬 commented: {notification.commentContent}</span>
                    )}
                    {notification.type === "message" && (
                      <span className="text-purple-400">📩 sent a message: {notification.messageContent}</span>
                    )}
                    {notification.type === "follow" && (
                      <span className="text-pink-400">👤 started following you</span>
                    )}
                  </p>
                  <span className="text-sm text-gray-400">
                    {new Date(notification.createdAt).toLocaleString()}
                  </span>
                </div>

                {!notification.isRead && (
                  <span className="text-4xl text-green-400 mt-2">•</span>
                )}
              </div>
            ))
          ) : (
            <p className="text-center text-gray-400">No notifications found</p>
          )}
        </div>
      </main>
    </div>
  );
};

export default Notification;
