// utils/agoraClient.ts
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
  
      if (agoraClient.connectionState === "CONNECTED" || agoraClient.connectionState === "CONNECTING") {
        console.warn("⚠️ Already connected or connecting to Agora");
        return; // ⛔ Không join lại
      }
  
      await agoraClient.join(APP_ID, channel, TOKEN, uid);
  
      [localAudioTrack, localVideoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
      console.log("✅ Tracks created");
  
      await agoraClient.publish([localAudioTrack, localVideoTrack]);
      console.log("📡 Published tracks");
  
      localVideoTrack.play("local-player");
    } catch (error) {
      console.error("❌ joinAgora failed:", error);
    }
  };
  
  
  

export const leaveAgora = async () => {
    if (localAudioTrack) {
        localAudioTrack.stop();
        localAudioTrack.close();
    }
    if (localVideoTrack) {
        localVideoTrack.stop();
        localVideoTrack.close();
    }
    await agoraClient.leave();
};
