import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { GoogleLogo } from "../../assets";
import { InputField } from "./components";
import { useGoogleLogin } from "@react-oauth/google";
import { loginUser, loginWithGoogle,loginWithGoogleRegister, getUserProfile, getPhoneNumber} from '../../redux/slice/authSlice';
import { RootState, AppDispatch } from '../../redux/store';
import { useDispatch, useSelector } from 'react-redux';
import { fetchRecentNotifications } from '../../redux/slice/notificationSlice';

interface GoogleRegisterError {
  message: string;
  status: number;
}
const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { loading } = useSelector((state: RootState) => state.auth);

  const [form, setForm] = useState({ username: '', password: '' });
  const [errorText, setErrorText] = useState("");
  const [isBtnEnable, setIsBtnEnable] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    setIsBtnEnable(form.username.trim() !== "" && form.password.trim() !== "");
  }, [form]);

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
      // Tạo gradient dọc từ trên xuống dưới
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, "#0f172a");
      gradient.addColorStop(1, "#1e293b");

      // Fill background với gradient
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Vẽ các ngôi sao
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
       handleLogin();
    }
  };

  const handleLogin = () => {
    if (!isBtnEnable) return;
    
    dispatch(loginUser(form))
      .unwrap()
      .then((res) => {
        // Token đã được lưu vào localStorage trong reducer
        // console.log("Login successful, token:", res.token);
        
        // Gọi API để lấy thông tin chi tiết người dùng
        dispatch(getUserProfile(res.token))
          .unwrap()
          .then((profileRes) => {
            const userDetail = profileRes.userDetail;
            
            // Kiểm tra xem người dùng đã có thông tin chi tiết chưa
            if (userDetail && userDetail.firstname && userDetail.lastname) {
                // lấy danh sách thông báo 
              dispatch(fetchRecentNotifications());
              // Đã có thông tin chi tiết, chuyển đến trang home
              navigate('/home');
            } else {
              // Chưa có thông tin chi tiết, lấy số điện thoại từ API
              dispatch(getPhoneNumber())
                .unwrap()
                .then((phoneRes) => {
                  // Chuyển đến trang userinfo với số điện thoại từ API
                  navigate('/userinfo', { 
                    state: { 
                      phoneNumber: phoneRes.phoneNumber || form.username,
                      email: profileRes.user?.email || ""
                    } 
                  });
                })
                .catch((phoneErr) => {
                  console.error('Error fetching phone number:', phoneErr);
                  // Nếu không lấy được số điện thoại, sử dụng username làm phương án dự phòng
                  navigate('/userinfo', {
                    state: {
                      phoneNumber: form.username
                    }
                  });
                });
            }
          })
          .catch((profileErr) => {
            console.error('Error fetching user profile:', profileErr);
            
            // Cố gắng lấy số điện thoại nếu không lấy được profile
            dispatch(getPhoneNumber())
              .unwrap()
              .then((phoneRes) => {
                navigate('/userinfo', {
                  state: {
                    phoneNumber: phoneRes.phoneNumber || form.username
                  }
                });
              })
              .catch(() => {
                // Nếu cả profile và số điện thoại đều không lấy được
                navigate('/userinfo', {
                  state: {
                    phoneNumber: form.username
                  }
                });
              });
          });
      })
      .catch((err) => {
        console.error('Login Error:', err);
        setErrorText('Invalid username or password. Please try again.');
      });
  };

      const handleGoogleLogin = useGoogleLogin({
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
      {/* Hiệu ứng nền sao */}
      <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full" />

      {/* Khối đăng nhập */}
      <div className="relative z-10 w-full max-w-md bg-gray-900 p-8 rounded-2xl shadow-lg text-white border border-gray-700">
        <h1 className="text-3xl font-bold text-center text-green-400">PULSE</h1>
        <p className="text-center text-xl mt-2">Log in to your account</p>
        <p className="text-center text-sm mt-2 text-gray-400">Welcome back! Please enter your details</p>
        <p className="h-4 text-red-500 text-sm text-center mt-2">{errorText}</p>

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

        <button className="mt-4 text-sm text-blue-400 hover:text-gray-200 cursor-pointer inline-block float-right"
        onClick={() => navigate("/forgot-password")}
        >
          Forgot Password?
        </button>

        <button
          onClick={handleLogin}
          className={`w-full mt-6 py-3 text-white font-bold rounded-full 
          ${isBtnEnable ? "bg-green-400 hover:bg-green-700 cursor-pointer" : "bg-gray-600 cursor-not-allowed"}`}
          disabled={!isBtnEnable}
        >
          {loading ? 'Logging in...' : 'Log in'}
        </button>

        <button 
          onClick={() => handleGoogleLogin()}
          className="w-full flex items-center justify-center mt-4 py-3 bg-gray-800 text-white rounded-full hover:bg-gray-700 cursor-pointer">
          <img src={GoogleLogo} alt="Google" className="w-5 h-5 mr-2" />
          Sign in with Google
        </button>

        <p className="text-center mt-4 text-sm text-gray-400">
          Don’t have an account?{" "}
          <span className="text-green-400 cursor-pointer" onClick={() => navigate("/register")}>
            Sign up, it’s free!
          </span>
        </p>
      </div>
    </div>
  );
};

export default Login;
