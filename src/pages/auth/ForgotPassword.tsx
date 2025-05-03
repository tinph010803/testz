import type React from "react";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { checkEmailOrPhoneExists, sendResetPasswordToEmail } from "../../redux/slice/authSlice";
import type { RootState, AppDispatch } from "../../redux/store";
import { auth } from "../../firebase/setup";
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from "firebase/auth";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  useSelector((state: RootState) => state.auth);

  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [errorText, setErrorText] = useState("");
  const [successText, setSuccessText] = useState("");
  const [isBtnEnable, setIsBtnEnable] = useState(false);
  const [loading, setLoading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);


  useEffect(() => {
    setIsBtnEnable(emailOrPhone.trim() !== "");
  }, [emailOrPhone]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const stars = Array.from({ length: 299 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 1.5 + 0.5,
    }));

    const drawStars = () => {
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, "#0f172a");
      gradient.addColorStop(1, "#1e293b");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "white";
      stars.forEach((star) => {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fill();
      });
    };

    drawStars();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmailOrPhone(e.target.value);
    setErrorText("");
    setSuccessText("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && isBtnEnable) {
      handleResetPassword();
    }
  };
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };
  
  const handleVerifyOtp = async () => {
    try {
      const otpCode = otp.join("");
  
      if (!confirmationResult) {
        setErrorText("OTP verification failed. Please request a new OTP.");
        return;
      }
  
      await confirmationResult.confirm(otpCode);
      setIsOtpModalOpen(false);
  
      // Truyền số điện thoại qua route
      navigate("/reset-password", { state: { phoneNumber: emailOrPhone.trim() } });
    } catch (error) {
      console.error("Invalid OTP:", error);
      setErrorText("Invalid OTP! Please try again.");
    }
  };
  
  

  // const handleResetPassword = async () => {
  //   if (!isBtnEnable) return;
  //   setLoading(true);
  //   setErrorText("");
  //   setSuccessText("");

  //   const isEmail = emailOrPhone.includes("@");

  //   try {
  //     const result = await dispatch(
  //       checkEmailOrPhoneExists(
  //         isEmail
  //           ? { email: emailOrPhone.trim() }
  //           : { phoneNumber: emailOrPhone.trim() }
  //       )
  //     );

  //     if (checkEmailOrPhoneExists.fulfilled.match(result)) {
  //       // Gửi email reset nếu là email
  //       if (isEmail) {
  //         const sendResult = await dispatch(
  //           sendResetPasswordToEmail({ email: emailOrPhone.trim() })
  //         );

  //         if (sendResetPasswordToEmail.rejected.match(sendResult)) {
  //           setErrorText(sendResult.payload as string || "Failed to send reset email");
  //           setLoading(false);
  //           return;
  //         }
  //       }

  //       alert("Password reset link has been sent to your email");
  //       setEmailOrPhone("");
  //       navigate("/");
  //     } else {
  //       setErrorText(result.payload as string || "Account not found");
  //     }
  //   } catch (err) {
  //     setErrorText("Something went wrong");
  //   } finally {
  //     setLoading(false);
  //   }
  // };
  const handleResetPassword = async () => {
    if (!isBtnEnable) return;
    setLoading(true);
    setErrorText("");
    setSuccessText("");

    const isEmail = emailOrPhone.includes("@");

    try {
      const result = await dispatch(
        checkEmailOrPhoneExists(
          isEmail
            ? { email: emailOrPhone.trim() }
            : { phoneNumber: emailOrPhone.trim() }
        )
      );

      if (checkEmailOrPhoneExists.fulfilled.match(result)) {
        if (isEmail) {
          // ✅ Gửi link reset qua email
          const sendResult = await dispatch(sendResetPasswordToEmail({ email: emailOrPhone.trim() }));
          if (sendResetPasswordToEmail.rejected.match(sendResult)) {
            setErrorText(sendResult.payload as string || "Failed to send reset email");
            setLoading(false);
            return;
          }

          alert("Password reset link has been sent to your email");
          setEmailOrPhone("");
          navigate("/");
        } else {
          // ✅ Gửi OTP xác thực qua phone
          if (!window.recaptchaVerifier) {
            window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
              size: "invisible",
              callback: () => { },
            });
          }

          const appVerifier = window.recaptchaVerifier;
          const result = await signInWithPhoneNumber(auth, "+84" + emailOrPhone.trim().slice(1), appVerifier);
          setConfirmationResult(result);
          setIsOtpModalOpen(true);
        }
      } else {
        setErrorText(result.payload as string || "Account not found");
      }
    } catch (err) {
      setErrorText("Something went wrong");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="relative w-full h-screen flex items-center justify-center">
      <div id="recaptcha-container"></div>

      <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full" />

      <div className="relative z-10 w-full max-w-md bg-gray-900 p-8 rounded-2xl shadow-lg text-white border border-gray-700">
        <h1 className="text-3xl font-bold text-center text-green-400">PULSE</h1>
        <p className="text-center text-xl mt-2">Reset your password</p>
        <p className="text-center text-sm mt-2 text-gray-400">
          Enter your email address or phone number and we'll send you a link to reset your password
        </p>

        {errorText && <p className="h-4 text-red-500 text-sm text-center mt-2">{errorText}</p>}
        {successText && <p className="h-4 text-green-500 text-sm text-center mt-2">{successText}</p>}

        <div className="mt-6">
          <input
            type="text"
            name="emailOrPhone"
            placeholder="Email address or phone number"
            value={emailOrPhone}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 border border-gray-700"
          />
        </div>

        <button
          onClick={handleResetPassword}
          className={`w-full mt-6 py-3 text-white font-bold rounded-full cursor-pointer
          ${isBtnEnable ? "bg-green-400 hover:bg-green-700" : "bg-gray-600 cursor-not-allowed"}`}
          disabled={!isBtnEnable || loading}
        >
          {loading ? "Sending..." : "Send Reset Link"}
        </button>

        <p className="text-center mt-4 text-sm text-gray-400">
          Remember your password?{" "}
          <button className="text-green-400 hover:text-green-300 cursor-pointer" onClick={() => navigate("/")}>
            Back to login
          </button>
        </p>
      </div>

      {isOtpModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg w-96 text-center">
            <h2 className="text-xl font-bold mb-4">Enter OTP</h2>
            <p className="text-sm text-gray-500">We've sent a verification code to +84{emailOrPhone.slice(1)}</p>

            <div className="flex justify-center gap-2 mt-4">
              {otp.map((num, index) => (
                <input
                  key={index}
                  id={`otp-${index}`}
                  type="text"
                  maxLength={1}
                  value={num}
                  autoComplete="off"
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && index === otp.length - 1) {
                      handleVerifyOtp();
                    }
                    if (e.key === "Backspace" && !otp[index] && index > 0) {
                      document.getElementById(`otp-${index - 1}`)?.focus();
                    }
                  }}
                  className="w-10 h-10 text-center border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              ))}
            </div>

            <button
              onClick={handleVerifyOtp}
              className="bg-green-500 text-white px-4 py-2 mt-4 mr-4 rounded cursor-pointer"
            >
              Verify OTP
            </button>
            <button
              onClick={() => setIsOtpModalOpen(false)}
              className="text-red-500 mt-4 ml-4 cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default ForgotPassword;
