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

// ✏️ Thay thế hàm joinAgora bằng 2 hàm mới

export const joinOnly = async (channel: string, uid: string) => {
  try {
    console.log("➡️ Joining only channel", channel, "with UID", uid);

    if (
      agoraClient.connectionState === "CONNECTED" ||
      agoraClient.connectionState === "CONNECTING"
    ) {
      console.warn("⚠️ Already connected. Leaving first...");
      await leaveAgora();
    }

    await agoraClient.join(APP_ID, channel, TOKEN, uid);
  } catch (error) {
    console.error("❌ joinOnly failed:", error);
  }
};

export const publishTracks = async () => {
  try {
    // Không truyền cameraId → dùng đúng camera mặc định của trình duyệt
    [localAudioTrack, localVideoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();

    console.log("✅ Created local tracks with default devices");
    await agoraClient.publish([localAudioTrack, localVideoTrack]);
    console.log("📡 Published tracks");
  } catch (error) {
    console.error("❌ publishTracks failed:", error);
  }
};


// ✅ Nếu vẫn cần giữ hàm cũ để dùng nhanh, thì để như sau:
export const joinAgora = async (channel: string, uid: string) => {
  await joinOnly(channel, uid);
  await publishTracks();
};


export const leaveAgora = async () => {
  try {
    console.log("⬅️ Leaving Agora channel");

    if (localAudioTrack) {
      localAudioTrack.stop();
      localAudioTrack.close();
      localAudioTrack = null; // 👈 reset lại
    }

    if (localVideoTrack) {
      localVideoTrack.stop();
      localVideoTrack.close();
      localVideoTrack = null; // 👈 reset lại
    }

    if (
      agoraClient.connectionState === "CONNECTED" ||
      agoraClient.connectionState === "CONNECTING"
    ) {
      await agoraClient.leave();
      agoraClient.removeAllListeners();
    }

    agoraClient.removeAllListeners(); // 👈 tránh giữ sự kiện cũ
  } catch (error) {
    console.error("❌ leaveAgora failed:", error);
  }
};
