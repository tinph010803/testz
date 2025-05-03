import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { User, Mail, Phone, Calendar } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../redux/store";
import { createUserDetail } from "../../redux/slice/userSlice";
import { getUserProfile, sendEmailOtp, verifyEmailOtp, checkEmailOrPhoneExists } from "../../redux/slice/authSlice";
import { auth } from "../../firebase/setup";
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from "firebase/auth";

export default function UserProfileForm() {
  const location = useLocation();
  const navigate = useNavigate();
  const { phoneNumber = "", email = "" } = location.state || {};
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  const dispatch = useDispatch<AppDispatch>();
  const { userDetails } = useSelector((state: RootState) => state.user);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    dob: "",
    gender: "male",
    phoneNumber: phoneNumber || "",
    email: email || "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // OTP related states
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpType, setOtpType] = useState<"email" | "phone">("email");
  const [otpError, setOtpError] = useState("");

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
      // Create vertical gradient from top to bottom
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, "#0f172a");
      gradient.addColorStop(1, "#1e293b");

      // Fill background with gradient
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw stars
      ctx.fillStyle = "white";
      stars.forEach((star) => {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fill();
      });
    };

    drawStars();

    // Resize handler
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      drawStars();
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    if (userDetails) {
      setFormData((prev) => ({
        ...prev,
        firstname: userDetails.firstname,
        lastname: userDetails.lastname,
        dob: userDetails.dob,
        gender: userDetails.gender,
        phoneNumber: userDetails.phoneNumber,
        email: userDetails.email,
      }));
    }
  }, [userDetails]);

  useEffect(() => {
    if (isOtpModalOpen) {
      // Reset OTP fields when opening modal
      setOtp(["", "", "", "", "", ""]);

      // Focus on first OTP input after reset
      setTimeout(() => {
        document.getElementById("otp-0")?.focus();
      }, 100);
    }
  }, [isOtpModalOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
  
    // Regex chuẩn
    const vietnamPhoneRegex = /^(0[35789])\d{8}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
    // Validate tên
    if (!formData.firstname.trim()) newErrors.firstname = "First name is required";
    if (!formData.lastname.trim()) newErrors.lastname = "Last name is required";
  
    // Nếu chưa đăng ký bằng email thì cần validate email
    if (!phoneNumber && formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }
  
    // Nếu chưa đăng ký bằng số điện thoại thì cần validate số điện thoại
    if (!email && formData.phoneNumber && !vietnamPhoneRegex.test(formData.phoneNumber)) {
      newErrors.phoneNumber = "Invalid Vietnamese phone number format";
    }
  
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  

  // const handleSubmit = (e: React.FormEvent) => {
  //   e.preventDefault();

  //   if (validateForm()) {
  //     // Determine which type of OTP verification to show
  //     if (phoneNumber) {
  //       // If registered with phone, show email OTP verification
  //       setOtpType("email");
  //       setIsOtpModalOpen(true);
  //     } else if (email) {
  //       // If registered with Google/email, show phone OTP verification
  //       setOtpType("phone");
  //       setIsOtpModalOpen(true);
  //     } else {
  //       // Fallback - shouldn't normally happen
  //       submitUserDetails();
  //     }
  //   }
  // };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  
    // Gọi validate cơ bản trước
    const isValid = validateForm();
    if (!isValid) return;
  
    // Kiểm tra định dạng phone (nếu người dùng đăng ký bằng email)
    if (!phoneNumber && !/^(0[35789])\d{8}$/.test(formData.phoneNumber)) {
      setErrors((prev) => ({
        ...prev,
        phoneNumber: "Invalid Vietnamese phone number format",
      }));
      return;
    }
  
    // Kiểm tra định dạng email (nếu đăng ký bằng phone)
    if (!email && !/^.+@.+\..+$/.test(formData.email)) {
      setErrors((prev) => ({
        ...prev,
        email: "Invalid email format",
      }));
      return;
    }
  
    try {
      if (phoneNumber) {
        // ✅ Đăng ký bằng số điện thoại => xác thực email
  
        // Kiểm tra email đã tồn tại chưa
        const checkEmailResult = await dispatch(
          checkEmailOrPhoneExists({ email: formData.email })
        );
  
        if (checkEmailOrPhoneExists.fulfilled.match(checkEmailResult)) {
          const message = checkEmailResult.payload?.message?.toLowerCase?.() || "";
          if (message.includes("exists") || message.includes("already in use")) {
            setErrors((prev) => ({
              ...prev,
              email: "Email already in use",
            }));
            return;
          }
        }
  
        // Nếu chưa tồn tại thì gửi OTP qua email
        await dispatch(sendEmailOtp({ email: formData.email })).unwrap();
        setOtpType("email");
        setIsOtpModalOpen(true);
        setOtpError("");
      } else if (email) {
        // ✅ Đăng ký bằng email => xác thực số điện thoại
  
        // Kiểm tra số điện thoại đã tồn tại chưa
        const resultAction = await dispatch(
          checkEmailOrPhoneExists({ phoneNumber: formData.phoneNumber })
        );
  
        if (checkEmailOrPhoneExists.fulfilled.match(resultAction)) {
          const message = resultAction.payload?.message?.toLowerCase?.() || "";
          if (message.includes("exists") || message.includes("already in use")) {
            setErrors((prev) => ({
              ...prev,
              phoneNumber: "Phone number already exists",
            }));
            return;
          }
        }
  
        // Gửi OTP qua số điện thoại
        setOtpType("phone");
  
        if (!window.recaptchaVerifier) {
          window.recaptchaVerifier = new RecaptchaVerifier(
            auth,
            "recaptcha-container",
            {
              size: "invisible",
              callback: () => {},
            }
          );
        }
  
        const appVerifier = window.recaptchaVerifier;
        const result = await signInWithPhoneNumber(
          auth,
          "+84" + formData.phoneNumber.slice(1),
          appVerifier
        );
  
        setConfirmationResult(result);
        setIsOtpModalOpen(true);
      } else {
        // fallback không có phone/email
        submitUserDetails();
      }
    } catch (err: any) {
      const errMsg =
        err?.payload?.message?.toLowerCase?.() ||
        err?.message?.toLowerCase?.() ||
        "OTP sending failed";
  
      if (
        errMsg.includes("already in use") ||
        errMsg.includes("exists") ||
        errMsg.includes("email đã tồn tại")
      ) {
        setErrors((prev) => ({ ...prev, email: "Email already in use" }));
      } else if (errMsg.includes("email")) {
        setErrors((prev) => ({ ...prev, email: "Invalid email" }));
      } else if (errMsg.includes("phone")) {
        setErrors((prev) => ({ ...prev, phoneNumber: "Phone number error" }));
      } else {
        setOtpError(errMsg);
      }
    }
  };
  
  

  // const handleVerifyOtp = async () => {
  //   const otpCode = otp.join("");
  //   if (otpCode.length < 6) {
  //     setOtpError("Please enter full 6-digit OTP");
  //     return;
  //   }

  //   try {
  //     if (otpType === "email") {
  //       // await dispatch(verifyEmailOtp({ email: formData.email, otp: otpCode })).unwrap();
  //       setOtpError("");
  //       setIsOtpModalOpen(false);
  //       submitUserDetails();
  //     } else if (otpType === "phone") {
  //       if (!confirmationResult) {
  //         setOtpError("Missing confirmation result. Please try again.");
  //         return;
  //       }
  //       await dispatch(verifyEmailOtp({ email: formData.email, otp: otpCode })).unwrap();
  //       setOtpError("");
  //       setIsOtpModalOpen(false);
  //       submitUserDetails();
  //     }
  //   } catch (err) {
  //     console.error("OTP verification failed:", err);
  //     setOtpError("Invalid OTP. Please try again.");
  //   }
  // };
  const handleVerifyOtp = async () => {
    const otpCode = otp.join("");
    if (otpCode.length < 6) {
      setOtpError("Please enter full 6-digit OTP");
      return;
    }

    try {
      if (otpType === "email") {
        // ✅ Xác minh OTP email với server
        await dispatch(verifyEmailOtp({ email: formData.email, otp: otpCode })).unwrap();
        setOtpError("");
        setIsOtpModalOpen(false);
        submitUserDetails();
      } else if (otpType === "phone") {
        // ✅ Xác minh OTP điện thoại bằng Firebase
        if (!confirmationResult) {
          setOtpError("Missing confirmation result. Please try again.");
          return;
        }
        await confirmationResult.confirm(otpCode);
        setOtpError("");
        setIsOtpModalOpen(false);
        submitUserDetails();
      }
    } catch (err) {
      console.error("OTP verification failed:", err);
      setOtpError("Invalid OTP. Please try again.");
    }
  };


  const submitUserDetails = () => {
    setIsSubmitting(true);

    const dataToSend = {
      ...formData,
      avatar: "",
      backgroundAvatar: "",
    };

    console.log(dataToSend);

    dispatch(createUserDetail(dataToSend))
      .unwrap()
      .then((response) => {
        console.log("User details created successfully:", response);

        // Call getUserProfile to update information in Sidebar
        const token = localStorage.getItem("token");
        if (token) {
          dispatch(getUserProfile(token));
        }

        setIsSubmitting(false);
        setSubmitSuccess(true);
        setTimeout(() => setSubmitSuccess(false), 3000);
        navigate('/home');
      })
      .catch((err) => {
        console.error("Error creating user details:", err);
        setIsSubmitting(false);
      });
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



  return (
    <div className="min-h-screen bg-[#0a1122] flex items-center justify-center p-4 relative overflow-hidden">
      <div id="recaptcha-container"></div>
      {/* Starry background effect */}
      <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full" />

      <div className="w-full max-w-2xl bg-slate-900/70 rounded-lg border border-slate-800 shadow-xl overflow-hidden relative z-10">
        <div className="p-6 sm:p-8">
          <h1 className="text-3xl font-bold text-center text-green-400 mb-2">PULSE</h1>
          <h2 className="text-xl font-semibold text-center text-white mb-1">User Profile</h2>
          <p className="text-slate-400 text-center mb-6">Please enter your details</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* First Name & Last Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* First Name */}
              <div className="space-y-1">
                <label htmlFor="firstname" className="block text-sm font-medium text-slate-300">
                  First Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <input
                    id="firstname"
                    name="firstname"
                    type="text"
                    value={formData.firstname}
                    placeholder="John"
                    onChange={handleChange}
                    className={`w-full pl-9 py-2 bg-slate-800/50 border ${errors.firstname ? "border-red-500" : "border-slate-700"} rounded-md text-white focus:outline-none focus:ring-1 focus:ring-green-500`}
                  />
                </div>
                {errors.firstname && <p className="text-red-500 text-xs mt-1">{errors.firstname}</p>}
              </div>

              {/* Last Name */}
              <div className="space-y-1">
                <label htmlFor="lastname" className="block text-sm font-medium text-slate-300">
                  Last Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <input
                    id="lastname"
                    name="lastname"
                    type="text"
                    value={formData.lastname}
                    placeholder="Doe"
                    onChange={handleChange}
                    className={`w-full pl-9 py-2 bg-slate-800/50 border ${errors.lastname ? "border-red-500" : "border-slate-700"} rounded-md text-white focus:outline-none focus:ring-1 focus:ring-green-500`}
                  />
                </div>
                {errors.lastname && <p className="text-red-500 text-xs mt-1">{errors.lastname}</p>}
              </div>
            </div>

            {/* Date of Birth & Gender */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Date of Birth */}
              <div className="space-y-1">
                <label htmlFor="dob" className="block text-sm font-medium text-slate-300">
                  Date of Birth
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <input
                    id="dob"
                    name="dob"
                    type="date"
                    value={formData.dob}
                    onChange={handleChange}
                    required
                    className="w-full pl-9 py-2 bg-slate-800/50 border border-slate-700 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-green-500"
                  />
                </div>
              </div>

              {/* Gender */}
              <div className="space-y-1">
                <label htmlFor="gender" className="block text-sm font-medium text-slate-300">
                  Gender
                </label>
                <select
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-green-500"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            {/* Phone Number & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Phone Number */}
              <div className="space-y-1">
                <label htmlFor="phoneNumber" className="block text-sm font-medium text-slate-300">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <input
                    id="phoneNumber"
                    name="phoneNumber"
                    type="text"
                    value={formData.phoneNumber}
                    placeholder="+84xxxxxxxxx or 0xxxxxxxxx"
                    readOnly={!!phoneNumber}
                    onChange={handleChange}
                    required
                    className={`w-full pl-9 py-2 bg-slate-800/50 border ${errors.phoneNumber ? "border-red-500" : "border-slate-700"} rounded-md text-white focus:outline-none focus:ring-1 focus:ring-green-500`}
                  />
                </div>
                {errors.phoneNumber ? (
                  <p className="text-red-500 text-xs mt-1">{errors.phoneNumber}</p>
                ) : (
                  <p className="text-slate-500 text-xs mt-1">
                    Vietnamese format: +84 or 0 followed by 9 digits
                  </p>
                )}


              </div>

              {/* Email */}
              <div className="space-y-1">
                <label htmlFor="email" className="block text-sm font-medium text-slate-300">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <input
                    id="email"
                    name="email"
                    type="text"
                    value={formData.email}
                    placeholder="example@domain.com"
                    readOnly={!!email}
                    onChange={handleChange}
                    required
                    className={`w-full pl-9 py-2 bg-slate-800/50 border ${errors.email ? "border-red-500" : "border-slate-700"} rounded-md text-white focus:outline-none focus:ring-1 focus:ring-green-500`}
                  />
                </div>
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                )}
                {!errors.email && (
                  <p className="text-slate-500 text-xs mt-1">We'll send verification code to this email</p>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-green-500 hover:bg-green-600 text-white font-medium rounded-md transition-colors duration-200 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving..." : "Save Profile"}
              </button>
              {submitSuccess && <p className="mt-2 text-center text-green-400">Profile saved successfully!</p>}
            </div>
          </form>
        </div>
      </div>

      {/* OTP Modal */}
      {isOtpModalOpen && (
        <div
          className="fixed inset-0 bg-black/50 flex justify-center items-center z-50"
          onKeyDown={(e) => {
            if (e.key === "Escape") setIsOtpModalOpen(false);
          }}
          tabIndex={-1}
        >
          <div className="bg-slate-800 p-6 rounded-lg w-96 text-center border border-slate-700 shadow-xl">
            <h2 className="text-xl font-bold mb-4 text-white">Verification Required</h2>

            {otpType === "email" ? (
              <p className="text-sm text-slate-300 mb-2">
                We've sent a verification code to your email: <span className="font-semibold">{formData.email}</span>
              </p>
            ) : (
              <p className="text-sm text-slate-300 mb-2">
                We've sent a verification code to your phone: <span className="font-semibold">{formData.phoneNumber}</span>
              </p>
            )}

            <p className="text-xs text-slate-400 mb-4">Please enter the 6-digit code to verify your identity</p>
            {otpError && (
              <p className="text-sm text-red-500 mb-2">{otpError}</p>
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
                  className="w-10 h-10 text-center bg-slate-700 border border-slate-600 rounded focus:outline-none focus:ring-2 focus:ring-green-500 text-white"
                />
              ))}
            </div>

            <div className="flex justify-center space-x-4 mt-6">

              <button
                onClick={() => setIsOtpModalOpen(false)}
                className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-2 rounded-md transition-colors duration-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleVerifyOtp}
                className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-md transition-colors duration-200 cursor-pointer"
              >
                Verify
              </button>
            </div>

            {/* <div className="mt-4 text-sm text-slate-400">
              Didn't receive a code? <button className="text-green-400 hover:text-green-300 cursor-pointer">Resend code</button>
            </div> */}
            <div className="mt-4 text-sm text-slate-400">
              Didn't receive a code?{" "}
              <button
                className="text-green-400 hover:text-green-300 cursor-pointer"
                onClick={async () => {
                  try {
                    if (otpType === "email") {
                      await dispatch(sendEmailOtp({ email: formData.email })).unwrap();
                      setOtpError("OTP resent to email.");
                    } else if (otpType === "phone" && confirmationResult) {
                      // Resend không hỗ trợ trực tiếp với Firebase, cần reset recaptcha và gọi lại signIn
                      if (window.recaptchaVerifier) {
                        window.recaptchaVerifier.clear();
                      }
                      window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
                        size: "invisible",
                        callback: () => { },
                      });
                      const result = await signInWithPhoneNumber(
                        auth,
                        "+84" + formData.phoneNumber.slice(1),
                        window.recaptchaVerifier
                      );
                      setConfirmationResult(result);
                      setOtpError("OTP resent to phone.");
                    }
                  } catch (err) {
                    console.error("Resend OTP failed:", err);
                    setOtpError("Failed to resend OTP. Try again later.");
                  }
                }}
              >
                Resend code
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}