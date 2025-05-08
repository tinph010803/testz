import React, { useEffect, useState, useRef } from "react";
import { PhoneOff, Mic, MicOff, Video, VideoOff } from "lucide-react";
import { agoraClient, localAudioTrack, localVideoTrack, leaveAgora } from "../../../utils/agoraClient";
import socketCall from "../../../utils/socketCall";
import { useSelector } from "react-redux";
import { RootState } from "../../../redux/store";
import type { IAgoraRTCRemoteUser } from "agora-rtc-sdk-ng";

interface OngoingCallModalProps {
  callerName: string;
  callerAvatar: string;
  calleeName: string;
  calleeAvatar: string;
  onEndCall: () => void;
  localStream: MediaStream | null;
}

const OngoingCallModal: React.FC<OngoingCallModalProps> = ({
  callerName,
  callerAvatar,
  calleeName,
  calleeAvatar,
  onEndCall,
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [hasRemoteVideo, setHasRemoteVideo] = useState(false);
  const call = useSelector((state: RootState) => state.call);
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const remotePlayerRef = useRef<HTMLDivElement>(null);
  const localPlayerRef = useRef<HTMLDivElement>(null);

  // Đảm bảo local video được hiển thị
  useEffect(() => {
    const playLocalVideo = () => {
      if (localPlayerRef.current && localVideoTrack) {
        try {
          console.log("🎥 Attempting to play local video");
          localVideoTrack.play(localPlayerRef.current);
        } catch (err) {
          console.error("⚠️ Không thể play local video:", err);
        }
      }
    };

    // Thử play ngay và lặp lại sau 300ms để đảm bảo DOM đã sẵn sàng
    playLocalVideo();
    const interval = setInterval(playLocalVideo, 300);

    // Dọn dẹp sau 3 giây
    setTimeout(() => clearInterval(interval), 3000);

    return () => clearInterval(interval);
  }, []);

  // Xử lý sự kiện Agora
  useEffect(() => {
    const handleUserPublished = async (user: IAgoraRTCRemoteUser, 
      mediaType: "audio" | "video") => {
      await agoraClient.subscribe(user, mediaType);
      console.log(`✅ Subscribed to ${user.uid} for ${mediaType}`);

      if (mediaType === "video" && user.videoTrack) {
        if (remotePlayerRef.current) {
          console.log("🎬 Playing remote video");
          user.videoTrack.play(remotePlayerRef.current);
          setHasRemoteVideo(true);
        } else {
          console.warn("⚠️ Remote container not found");
        }
      }

      if (mediaType === "audio" && user.audioTrack) {
        console.log("🔊 Playing remote audio");
        user.audioTrack.play();
      }
    };

    const handleUserUnpublished = (user: IAgoraRTCRemoteUser, 
      mediaType: "audio" | "video") => {
      console.log(`📴 User ${user.uid} unpublished ${mediaType}`);
      if (mediaType === "video") {
        setHasRemoteVideo(false);
      }
    };

    // Register event handlers
    agoraClient.on("user-published", handleUserPublished);
    agoraClient.on("user-unpublished", handleUserUnpublished);

    return () => {
      // Clean up event listeners
      agoraClient.off("user-published", handleUserPublished);
      agoraClient.off("user-unpublished", handleUserUnpublished);
    };
  }, []);

  // Kết thúc cuộc gọi
  const handleEndCall = () => {
    const oppositeUserId =
      currentUser && currentUser._id === call.fromUserId ? call.toUserId : call.fromUserId;

    socketCall.emit("endCall", { toUserId: oppositeUserId });
    leaveAgora();
    onEndCall();
  };

  // Tăng thời gian mỗi giây
  useEffect(() => {
    const timer = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Format phút:giây
  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // Bật/tắt microphone
  const handleToggleMic = () => {
    if (localAudioTrack) {
      localAudioTrack.setEnabled(!isMuted);
      setIsMuted(!isMuted);
    }
  };

  // Bật/tắt camera
  const handleToggleCamera = () => {
    if (localVideoTrack) {
      localVideoTrack.setEnabled(!isCameraOff);
      setIsCameraOff(!isCameraOff);
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
      {/* Video wrapper */}
      <div className="absolute inset-0">
        {/* Remote video container */}
        <div 
          id="remote-player" 
          ref={remotePlayerRef} 
          className="w-full h-full bg-black rounded-xl flex items-center justify-center"
        >
          {!hasRemoteVideo && (
            <div className="text-white text-xl">Đang chờ video từ người dùng khác...</div>
          )}
        </div>

        {/* Local video container */}
        <div
          id="local-player"
          ref={localPlayerRef}
          className="absolute top-5 left-5 w-40 h-28 rounded-lg border-2 border-purple-500 overflow-hidden shadow-lg bg-gray-900 flex items-center justify-center"
        >
          {isCameraOff && (
            <div className="text-white text-xs">Camera đã tắt</div>
          )}
        </div>
      </div>

      {/* Duration & controls */}
      <div className="relative z-10 flex flex-col items-center justify-center space-y-6">
        <div className="text-white text-xl">{formatDuration(callDuration)}</div>

        <div className="flex items-center gap-6">
          <button
            onClick={handleToggleMic}
            className="bg-gray-700 hover:bg-gray-600 p-4 rounded-full"
          >
            {isMuted ? <MicOff size={28} className="text-white" /> : <Mic size={28} className="text-white" />}
          </button>

          <button
            onClick={handleToggleCamera}
            className="bg-gray-700 hover:bg-gray-600 p-4 rounded-full"
          >
            {isCameraOff ? <VideoOff size={28} className="text-white" /> : <Video size={28} className="text-white" />}
          </button>

          <button
            onClick={handleEndCall}
            className="bg-red-600 hover:bg-red-500 p-4 rounded-full"
          >
            <PhoneOff size={28} className="text-white" />
          </button>
        </div>
      </div>

      {/* Avatars & names */}
      <div className="absolute bottom-28 w-full flex items-center justify-center gap-10">
        <div className="flex flex-col items-center">
          <img src={callerAvatar} alt="caller" className="w-20 h-20 rounded-full mb-2 object-cover" />
          <span className="text-white font-semibold">{callerName}</span>
        </div>
        <div className="flex flex-col items-center">
          <img src={calleeAvatar} alt="callee" className="w-20 h-20 rounded-full mb-2 object-cover" />
          <span className="text-white font-semibold">{calleeName}</span>
        </div>
      </div>
    </div>
  );
};

export default OngoingCallModal;