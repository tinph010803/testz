import AgoraRTC, {
  IAgoraRTCClient,
  IMicrophoneAudioTrack,
  ICameraVideoTrack,
} from "agora-rtc-sdk-ng";

export const APP_ID = "ddbc9d658056487daa490c775a735132";
export const TOKEN = null;

export const agoraClient: IAgoraRTCClient = AgoraRTC.createClient({
  mode: "rtc",
  codec: "vp8",
});

export let localAudioTrack: IMicrophoneAudioTrack | null = null;
export let localVideoTrack: ICameraVideoTrack | null = null;

// ✅ Chỉ join channel (không tạo track)
export const joinOnly = async (channel: string, uid: string) => {
  try {
    console.log("➡️ Joining only channel:", channel, "UID:", uid);

    if (
      agoraClient.connectionState === "CONNECTED" ||
      agoraClient.connectionState === "CONNECTING"
    ) {
      console.warn("⚠️ Already connected. Leaving first...");
      await leaveAgora();
    }

    await agoraClient.join(APP_ID, channel, TOKEN || null, Number(uid));
    console.log("✅ Joined channel");

    // Cải thiện xử lý user-published event
    agoraClient.on("user-published", async (user, mediaType) => {
      try {
        await agoraClient.subscribe(user, mediaType);
        console.log("🔔 Subscribed to remote user:", user.uid, "mediaType:", mediaType);
    
        if (mediaType === "video" && user.videoTrack) {
          console.log("🎬 Remote video track received, preparing to play");
          // Đảm bảo container tồn tại trước khi play
          const checkAndPlayVideo = () => {
            const remoteContainer = document.getElementById("remote-player");
            if (remoteContainer) {
              console.log("🎥 Playing remote video in container");
              if (user.videoTrack) {
                user.videoTrack.play(remoteContainer);
              } else {
                console.warn("⚠️ user.videoTrack is undefined");
              }
            } else {
              console.warn("⚠️ remote-player not found, retrying in 300ms");
              setTimeout(checkAndPlayVideo, 300);
            }
          };
          
          checkAndPlayVideo();
        }
    
        if (mediaType === "audio" && user.audioTrack) {
          console.log("🔊 Playing remote audio");
          user.audioTrack.play();
        }
      } catch (err) {
        console.error("❌ Failed to subscribe to user:", err);
      }
    });

    agoraClient.on("user-joined", (user) => {
      console.log("👤 Remote user joined:", user.uid);
    });
    
    agoraClient.on("user-unpublished", (user, mediaType) => {
      console.log("📴 Remote user unpublished:", user.uid, "mediaType:", mediaType);
    });
    
  } catch (error) {
    console.error("❌ joinOnly failed:", error);
  }
};

// ✅ Tạo & publish audio/video tracks
export const publishTracks = async () => {
  try {
    const devices = await AgoraRTC.getCameras();
    console.log("📹 Available cameras:", devices.map(d => d.label || d.deviceId));

    // Lấy device mặc định được trình duyệt chọn
    const selectedDevice = devices.find((d) => d.label === '' || d.deviceId === 'default') || devices[0];

    if (!selectedDevice) throw new Error("No video device available");

    console.log("🎥 Using device:", selectedDevice.label || selectedDevice.deviceId);

    [localAudioTrack, localVideoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks(
      {}, // mic options
      { cameraId: selectedDevice.deviceId } // 👈 truyền đúng cameraId
    );

    if (!localAudioTrack || !localVideoTrack) {
      throw new Error("Failed to create local tracks");
    }

    console.log("📡 Publishing tracks to channel");
    await agoraClient.publish([localAudioTrack, localVideoTrack]);
    console.log("✅ Published tracks successfully");

    // Auto play local
    const localContainer = document.getElementById("local-player");
    if (localContainer && localVideoTrack) {
      console.log("🎥 Playing local video in container");
      localVideoTrack.play("local-player");
    } else {
      console.warn("⚠️ local-player not found or localVideoTrack is null");
    }
  } catch (error) {
    console.error("❌ publishTracks failed:", error);
    throw error; // Re-throw để caller có thể xử lý
  }
};

// ✅ Gộp lại gọi nhanh nếu không cần tách riêng
export const joinAgora = async (channel: string, uid: string) => {
  await joinOnly(channel, uid);
  await publishTracks();
};

// ✅ Thoát khỏi channel và dọn track
export const leaveAgora = async () => {
  try {
    console.log("⬅️ Leaving Agora channel");

    if (localAudioTrack) {
      localAudioTrack.stop();
      localAudioTrack.close();
      localAudioTrack = null;
    }

    if (localVideoTrack) {
      localVideoTrack.stop();
      localVideoTrack.close();
      localVideoTrack = null;
    }

    if (
      agoraClient.connectionState === "CONNECTED" ||
      agoraClient.connectionState === "CONNECTING"
    ) {
      await agoraClient.leave();
    }

    // Remove all event listeners to prevent memory leaks
    agoraClient.removeAllListeners();
    console.log("✅ Left channel and cleaned up tracks");

  } catch (error) {
    console.error("❌ leaveAgora failed:", error);
  }
};