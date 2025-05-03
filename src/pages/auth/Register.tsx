import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { GoogleLogo } from "../../assets";
import { InputField } from "./components";
import { useGoogleLogin } from "@react-oauth/google";
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../redux/store';
import { registerUserWithPhone, loginWithGoogleRegister, checkUserExists, loginWithGoogle } from '../../redux/slice/authSlice';

import { auth } from "../../firebase/setup";
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from "firebase/auth";
interface GoogleRegisterError {
    message: string;
    status: number;
}

const Register = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch<AppDispatch>();
    // const { loading, error } = useSelector((state: RootState) => state.auth);

    const [form, setForm] = useState({ phoneNumber: "", username: "", password: "", confirmPassword: "" });
    const [errorText, setErrorText] = useState("");
    const [isBtnEnable, setIsBtnEnable] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
    const [otpErrorText, setOtpErrorText] = useState("");

    useEffect(() => {
        setIsBtnEnable(
            form.phoneNumber.trim() !== "" &&
            form.username.trim() !== "" &&
            form.password.trim() !== "" &&
            form.confirmPassword.trim() !== ""
        );
    }, [form]);

    useEffect(() => {
        if (isOtpModalOpen) {
            // Reset OTP về rỗng khi mở modal
            setOtp(["", "", "", "", "", ""]);

            // Focus vào ô đầu tiên sau khi reset
            setTimeout(() => {
                document.getElementById("otp-0")?.focus();
            }, 100); // Delay nhẹ để tránh lỗi re-render ngay lập tức
        }
    }, [isOtpModalOpen]);

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
            // Gradient background
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
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
        setErrorText("");
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && isBtnEnable) {
            handleSignUp();
        }
    };

    const validatePhone = (phoneNumber: string) => {
        return /^(0[3|5|7|8|9])+([0-9]{8})$/.test(phoneNumber);
    };


    const handleSignUp = async () => {
        if (!validatePhone(form.phoneNumber)) {
            setErrorText("Invalid phone number format!");
            return;
        }
        console.log(form.phoneNumber);
        if (form.password.length < 6) {
            setErrorText("Password must be at least 6 characters long!");
            return;
        }

        if (form.password !== form.confirmPassword) {
            setErrorText("Passwords do not match!");
            return;
        }

        try {
            const check = await dispatch(checkUserExists({ phoneNumber: form.phoneNumber, username: form.username }))
                .unwrap();
            console.log("Check user exists result:", check.message);

            setErrorText("");

            // Kiểm tra và chỉ khởi tạo reCAPTCHA nếu chưa tồn tại
            if (!window.recaptchaVerifier) {
                window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
                    size: "invisible",
                    callback: (response: string) => {
                        console.log("reCAPTCHA solved:", response);
                    }
                });
            }

            const appVerifier = window.recaptchaVerifier;
            const result = await signInWithPhoneNumber(auth, "+84" + form.phoneNumber.slice(1), appVerifier);
            setConfirmationResult(result);
            setIsOtpModalOpen(true);

            console.log("OTP sent successfully");
            console.log("Confirmation result:", result);
            console.log("isOtpModalOpen set to true");
        } catch (err) {
            if (typeof err === 'string') {
                setErrorText(err); // Backend trả về message rõ ràng rồi
            } else {
                setErrorText("Đăng ký thất bại. Vui lòng thử lại.");
            }

            console.error("❌ Check failed or already exists:", err);
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
                setOtpErrorText("OTP verification failed. Please request a new OTP.");
                return;
            }

            await confirmationResult.confirm(otpCode);
            setIsOtpModalOpen(false);
            setOtpErrorText("");

            dispatch(registerUserWithPhone(form))
                .unwrap()
                .then((response) => {
                    console.log("Token đăng ký: ", response.token);
                    navigate("/userinfo", { state: { phoneNumber: form.phoneNumber } });
                })
                .catch((err) => {
                    console.error("Registration Error:", err);
                    setErrorText("Registration failed. Please try again.");
                });
        } catch (error) {
            console.error("Invalid OTP:", error);
            setOtpErrorText("Invalid OTP! Please try again.");
        }
    };


    const handleGoogleRegister = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            try {
                const res = await fetch("https://www.googleapis.com/oauth2/v1/userinfo?alt=json", {
                    headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
                });
                const userInfo = await res.json();

                // Gọi Register trước
                dispatch(loginWithGoogleRegister({
                    email: userInfo.email,
                    googleId: userInfo.id
                }))
                    .unwrap()
                    .then((response) => {
                        const { token, isVerified } = response;
                        localStorage.setItem("token", token);
                        if (isVerified) navigate("/home");
                        else navigate("/userinfo", { state: { email: userInfo.email, googleId: userInfo.id } });
                    })
                    .catch((err: GoogleRegisterError) => {
                        console.error("Register error:", err);

                        if (err?.status === 409) {
                            // Gọi login nếu đã tồn tại
                            dispatch(loginWithGoogle({
                                email: userInfo.email,
                                googleId: userInfo.id
                            }))
                                .unwrap()
                                .then((response) => {
                                    const { token, isVerified } = response;
                                    localStorage.setItem("token", token);
                                    if (isVerified) navigate("/home");
                                    else navigate("/userinfo", { state: { email: userInfo.email, googleId: userInfo.id } });
                                })
                                .catch((loginErr) => {
                                    console.error("Google login failed. Email already in use:", loginErr);
                                    setErrorText("Google login failed. Email already in use");
                                });
                        } else {
                            setErrorText(err?.message || "Google register failed.");
                        }
                    });

            } catch (error) {
                console.error("Error fetching Google user info:", error);
                setErrorText("Google login failed.");
            }
        },
        onError: () => setErrorText("Google login failed"),
    });




    return (
        <div className="relative w-full h-screen flex items-center justify-center">
            <div id="recaptcha-container"></div>
            {/* Hiệu ứng nền sao */}
            <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full" />

            {/* Khối đăng ký */}
            <div className="relative z-10 w-full max-w-md bg-gray-900 p-8 rounded-2xl shadow-lg text-white border border-gray-700">
                <h1 className="text-3xl font-bold text-center text-blue-500">PULSE</h1>
                <p className="text-center text-xl mt-2">Create your account</p>
                <p className="text-center text-sm mt-2 text-gray-400">
                    To use Pulse! Please enter your details
                </p>
                <p className="h-4 text-red-500 text-sm text-center mt-2">{errorText}</p>

                <InputField
                    type="tel"
                    name="phoneNumber"
                    placeholder="Phone Number"
                    value={form.phoneNumber}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                />

                <InputField
                    type="text"
                    name="username"
                    placeholder="Username"
                    value={form.username}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                />

                <InputField
                    type="password"
                    name="password"
                    placeholder="Password"
                    value={form.password}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    showPassword={showPassword}
                    onTogglePasswordVisibility={() => setShowPassword(!showPassword)}
                />

                <InputField
                    type="password"
                    name="confirmPassword"
                    placeholder="Confirm Password"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    showPassword={showConfirmPassword}
                    onTogglePasswordVisibility={() => setShowConfirmPassword(!showConfirmPassword)}
                />

                <button
                    onClick={handleSignUp}
                    className={`w-full mt-6 py-3 text-white font-bold rounded-full ${isBtnEnable ? "bg-blue-500 hover:bg-blue-700 cursor-pointer" : "bg-gray-600 cursor-not-allowed "
                        }`}
                    disabled={!isBtnEnable}
                >
                    Sign Up
                </button>

                <button
                    onClick={() => handleGoogleRegister()}
                    className="w-full flex items-center justify-center mt-4 py-3 bg-gray-800 text-white rounded-full hover:bg-gray-700 cursor-pointer">
                    <img src={GoogleLogo} alt="Google" className="w-5 h-5 mr-2" />
                    Sign up with Google
                </button>

                <p className="text-center text-sm text-gray-400 mt-4">
                    Already have an account?{" "}
                    <span className="text-blue-500 cursor-pointer" onClick={() => navigate("/")}>
                        Sign in here!
                    </span>
                </p>
            </div>

            {isOtpModalOpen && (
                <div
                    className="fixed inset-0 bg-black/50 flex justify-center items-center z-50"
                    onKeyDown={(e) => {
                        if (e.key === "Escape") setIsOtpModalOpen(false);
                    }}
                    tabIndex={-1} // Để có thể bắt sự kiện keydown trên div
                >
                    <div className="bg-white p-6 rounded-lg w-96 text-center">
                        <h2 className="text-xl font-bold mb-4">Enter OTP</h2>
                        <p className="text-sm text-gray-500">We've sent a verification code to +84{form.phoneNumber.slice(1)}</p>
                        {otpErrorText && (
                            <p className="text-sm text-red-500 mt-2">{otpErrorText}</p>
                        )}

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
                                        } else if (e.key === "ArrowRight" && index < otp.length - 1) {
                                            document.getElementById(`otp-${index + 1}`)?.focus();
                                        } else if (e.key === "ArrowLeft" && index > 0) {
                                            document.getElementById(`otp-${index - 1}`)?.focus();
                                        } else if (e.key === "Backspace" && !otp[index] && index > 0) {
                                            document.getElementById(`otp-${index - 1}`)?.focus();
                                        }
                                    }}
                                    className="w-10 h-10 text-center border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            ))}
                        </div>

                        <div className="flex justify-center gap-4 mt-6">
                            <button
                                onClick={() => setIsOtpModalOpen(false)}
                                className="px-5 py-2 border border-red-500 text-red-500 rounded hover:bg-red-100 transition cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleVerifyOtp}
                                className="px-5 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition cursor-pointer"
                            >
                                Verify OTP
                            </button>
                        </div>

                    </div>
                </div>
            )}

        </div>
    );
};

export default Register;