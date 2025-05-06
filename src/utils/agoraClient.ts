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

export const joinAgora = async (channel: string, uid: string) => {
  try {
    console.log("➡️ Joining channel", channel, "with UID", uid);

    // ⚠️ Leave if still connected (tránh bug khi reconnect)
    if (
      agoraClient.connectionState === "CONNECTED" ||
      agoraClient.connectionState === "CONNECTING"
    ) {
      console.warn("⚠️ Already connected to Agora. Leaving before re-joining...");
      await leaveAgora(); // 👈 phải leave sạch trước
    }
    await agoraClient.join(APP_ID, channel, TOKEN, uid);

    // ⚠️ Tạo mới track mỗi lần join
    [localAudioTrack, localVideoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
    console.log("✅ Created local tracks");

    await agoraClient.publish([localAudioTrack, localVideoTrack]);
    console.log("📡 Published tracks");

  } catch (error) {
    console.error("❌ joinAgora failed:", error);
  }
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
