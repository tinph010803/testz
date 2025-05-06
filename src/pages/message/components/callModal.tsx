import React, { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../../redux/store';
import { acceptedCall, clearLocalStream, closeCall, endCall, rejectedCall, startCall } from '../../../redux/slice/callSlice';
import socketCall from '../../../utils/socketCall';
import OngoingCallModal from './ongoingCallModal';
import { joinOnly, publishTracks } from "../../../utils/agoraClient";
import { useCallEndedListener } from '../../../redux/hooks/useCallEndedListener';
const CallModal: React.FC = () => {
  const dispatch = useDispatch();
  const call = useSelector((state: RootState) => state.call);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  useCallEndedListener(); // Custom hook để lắng nghe sự kiện kết thúc cuộc gọi


  useEffect(() => {
    socketCall.on('callAccepted', async () => {
      try {
        await joinOnly(`call_${call.fromUserId}_${call.toUserId}`, call.fromUserId);
        await publishTracks();
        dispatch(acceptedCall());
      } catch (err) {
        console.error("Failed to join Agora:", err);
      }
    });

    return () => {
      socketCall.off('callAccepted');
    };
  }, [dispatch, call.isVideo]);



  useEffect(() => {
    socketCall.on("callDeclined", ({ fromName }) => {
      console.log(`${fromName} declined the call`);

      dispatch(rejectedCall());
      dispatch(endCall());
    });

    return () => {
      socketCall.off("callDeclined");
    };
  }, []);

  useEffect(() => {
    if (call.isCalling) {
      // 🔊 Phát tiếng chuông từ Cloudinary
      audioRef.current = new Audio('https://res.cloudinary.com/df2amyjzw/video/upload/v1744890393/audiochuong_qdwihw.mp3');
      audioRef.current.loop = true;

      audioRef.current.play().catch((err) => {
        console.warn('Cannot autoplay ringtone:', err);
      });
    }

    let timeout: NodeJS.Timeout;

    if (call.isCalling && !call.isOngoing) {
      timeout = setTimeout(() => {
        dispatch(endCall());
      }, 10000); // 10s mới tắt nếu chưa nhận
    }

    return () => {
      if (timeout) clearTimeout(timeout);

      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, [call.isCalling, call.isOngoing]); // 👈 nhớ thêm call.isOngoing vào dependency


  const handleEndCall = () => {
    if (call.localStream) {
      call.localStream.getTracks().forEach(track => track.stop());
    }
    dispatch(clearLocalStream());
    dispatch(endCall());
  };

  if (!call.isVisible && !call.isOngoing) return null;

  return (
    <>
      {/* Nếu đang ongoing thì hiện modal mới */}
      {call.isOngoing ? (
        <OngoingCallModal
          callerName={call.fromName}
          callerAvatar={call.fromAvatar}
          calleeName={call.calleeName}
          calleeAvatar={call.calleeAvatar}
          onEndCall={handleEndCall}
          localStream={localStreamRef.current}
        />

      ) : (
        <div className="fixed bottom-5 right-5 z-50">
          <div className="bg-white dark:bg-[#222] text-black dark:text-white rounded-xl shadow-xl p-6 w-[300px] max-w-[90%] pointer-events-auto">
            <div className="mb-6 text-center">
              <img
                src={call.calleeAvatar}
                alt="avatar"
                className="w-24 h-24 rounded-full mx-auto"
              />
              <h2 className="mt-4 text-xl font-bold">{call.calleeName}</h2>
              <p className="text-gray-500">
                {call.rejectedByCallee
                  ? 'The call was declined.'
                  : call.isCalling
                    ? 'Calling...'
                    : 'The call has ended.'}
              </p>
            </div>

            <div className="flex justify-center gap-4">
              {!call.isCalling && (
                <button
                  className="bg-green-600 px-5 py-2 rounded-full hover:bg-green-700"
                  onClick={() => {
                    dispatch(startCall({
                      isVideo: call.isVideo,
                      calleeName: call.calleeName,
                      calleeAvatar: call.calleeAvatar,
                      toUserId: call.toUserId,
                      fromUserId: call.fromUserId,
                      fromName: call.fromName,
                      fromAvatar: call.fromAvatar,
                      isGroup: call.isGroup,
                      groupName: call.groupName,

                    }));

                    // Gửi lại socket thông báo gọi
                    setTimeout(() => {
                      socketCall.emit("incomingCall", {
                        toUserId: call.toUserId,
                        fromUserId: call.fromUserId,
                        fromName: call.fromName,
                        fromAvatar: call.fromAvatar,
                        isVideo: call.isVideo,
                        isGroup: call.isGroup || false,
                        groupName: call.groupName || undefined,
                      });
                    }, 100);
                  }}
                >
                  Call back
                </button>
              )}
              <button
                className="bg-red-600 px-5 py-2 rounded-full hover:bg-red-700"
                onClick={() => dispatch(closeCall())}
              >
                {call.isCalling ? 'Cancel' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );

};

export default CallModal;
