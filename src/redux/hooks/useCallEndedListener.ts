import { useEffect } from 'react';
import socketCall from '../../utils/socketCall';
import { useDispatch } from 'react-redux';
import { endCall } from '../slice/callSlice';
import { leaveAgora } from '../../utils/agoraClient';

export const useCallEndedListener = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    const handleEnd = async () => {
      console.log("📞 Received 'callEnded' event");
      await leaveAgora();
      dispatch(endCall());

      const el1 = document.getElementById("local-player");
      const el2 = document.getElementById("remote-player");
      if (el1) el1.innerHTML = "";
      if (el2) el2.innerHTML = "";
    };

    socketCall.on("callEnded", handleEnd);

    return () => {
      socketCall.off("callEnded", handleEnd);
    };
  }, [dispatch]);
};
