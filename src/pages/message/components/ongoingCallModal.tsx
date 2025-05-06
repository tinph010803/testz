import React, { useEffect, useState } from "react";
import { PhoneOff, Mic, MicOff, Video, VideoOff } from "lucide-react";
// import socketCall from "../../../utils/socketCall";
// import { useSelector } from "react-redux";
// import { RootState } from "../../../redux/store";
import { agoraClient } from "../../../utils/agoraClient";
import { leaveAgora } from "../../../utils/agoraClient";
import { localAudioTrack, localVideoTrack } from "../../../utils/agoraClient";
import socketCall from "../../../utils/socketCall";
import { useSelector } from "react-redux";
import { RootState } from "../../../redux/store";

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
  // localStream,
}) => {
  // const currentCall = useSelector((state: RootState) => state.call);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const call = useSelector((state: RootState) => state.call);
const currentUser = useSelector((state: RootState) => state.auth.user);

  useEffect(() => {
    const registerEventHandlers = () => {
      agoraClient.on("user-published", async (user, mediaType) => {
        await agoraClient.subscribe(user, mediaType);
        console.log("📡 Subscribed to", user.uid);
      
        if (mediaType === "audio" && user.audioTrack) {
          user.audioTrack.play(); // 🔈 BẮT BUỘC ĐỂ NGHE ÂM THANH
          console.log("🎧 Playing remote audio...");
        }
      
        if (mediaType === "video" && user.videoTrack) {
          user.videoTrack.play("remote-player"); // hoặc append vào element tuỳ bạn
        }
      });

      agoraClient.on("user-unpublished", (_, mediaType) => {
        console.log(`👋 User unpublished: ${mediaType}`);
      });
    };

    registerEventHandlers();

    return () => {
      agoraClient.removeAllListeners();
    };
  }, []);


  useEffect(() => {
    if (localVideoTrack) {
      try {
        localVideoTrack.play("local-player");
      } catch (err) {
        console.error("Không thể play local video:", err);
      }
    }
  }, []);
  
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
  const handleToggleMic = () => {
    if (localAudioTrack) {
      localAudioTrack.setEnabled(!isMuted);
      setIsMuted(!isMuted);
    }
  };

  const handleToggleCamera = () => {
    if (localVideoTrack) {
      localVideoTrack.setEnabled(!isCameraOff);
      setIsCameraOff(!isCameraOff);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex flex-col items-center justify-center z-50">
      <div id="local-player" style={{ width: 300, height: 200 }}></div>
      <div id="remote-player" style={{ width: 300, height: 200 }}></div>

      <div className="text-white text-2xl mb-4">
        {formatDuration(callDuration)}
      </div>

      <div className="flex items-center gap-10 mb-10">
        {/* Người gọi */}
        <div className="flex flex-col items-center">
          <img src={callerAvatar} alt="caller" className="w-24 h-24 rounded-full object-cover mb-2" />
          <span className="text-white font-semibold">{callerName}</span>
        </div>

        {/* Người được gọi */}
        <div className="flex flex-col items-center">
          <img src={calleeAvatar} alt="callee" className="w-24 h-24 rounded-full object-cover mb-2" />
          <span className="text-white font-semibold">{calleeName}</span>
        </div>
      </div>

      {/* Các nút chức năng */}
      <div className="flex items-center gap-8">
        <button
          onClick={handleToggleMic}
          className="bg-gray-700 hover:bg-gray-600 p-4 rounded-full cursor-pointer"
        >
          {isMuted ? <MicOff size={28} className="text-white" /> : <Mic size={28} className="text-white" />}
        </button>

        <button
          onClick={handleToggleCamera}
          className="bg-gray-700 hover:bg-gray-600 p-4 rounded-full cursor-pointer"
        >
          {isCameraOff ? <VideoOff size={28} className="text-white" /> : <Video size={28} className="text-white" />}
        </button>

        <button
          onClick={handleEndCall}
          className="bg-red-600 hover:bg-red-500 p-4 rounded-full cursor-pointer"
        >
          <PhoneOff size={28} className="text-white" />
        </button>
      </div>
    </div>
  );
};

export default OngoingCallModal;
