import { API_URL } from '../config';
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CarFront, User } from "lucide-react";

const Login = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState("customer");
  const [email, setEmail] = useState("user@example.com");
  const [password, setPassword] = useState("password");
  const [name, setName] = useState("Test User");
  const [age, setAge] = useState("25");
  const [gender, setGender] = useState("Male");
  
  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(true);
  const [keepMeLoggedIn, setKeepMeLoggedIn] = useState(true);

  // 50-Day Persistent Login Check
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
        setLoading(false);
        return;
    }

    const verifyToken = async () => {
        try {
            const res = await fetch(`${API_URL}/api/auth/check`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.valid) {
                 // Update local user in case it changed
                 localStorage.setItem("user", JSON.stringify(data.user));
                 if (data.user.role === "driver") navigate("/driver");
                 else navigate("/customer");
            } else {
                 localStorage.removeItem("token");
                 localStorage.removeItem("user");
                 setLoading(false);
            }
        } catch(e) {
            setLoading(false);
        }
    };
    verifyToken();
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      
      const data = await res.json();
      if (res.ok) {
        if (keepMeLoggedIn) localStorage.setItem("token", data.token); // The token itself is 50d from backend
        // Else could store in sessionStorage or don't store at all and rely on context, but instructions say "redirect him to the home screen for 50 days"
        else sessionStorage.setItem("token", data.token); // basic alternative

        localStorage.setItem("user", JSON.stringify(data.user));
        
        if (data.user.role === "driver") navigate("/driver");
        else navigate("/customer");
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleSignup = async (e) => {
      e.preventDefault();
      try {
          const res = await fetch(`${API_URL}/api/auth/signup`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ name, email, password, role, age, gender })
          });
          const data = await res.json();
          if (res.ok) {
              alert("Account created. Please login.");
              setIsSignup(false);
          } else {
              alert(data.message);
          }
      } catch(e) {}
  };

  if (loading) return <div className="min-h-screen w-full flex justify-center items-center text-white text-2xl">Authenticating Session...</div>;

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-74px)] relative w-full px-4">
      <div className="card shadow-2xl relative z-10 p-8" style={{ maxWidth: "450px", width: "100%", background: 'rgba(15, 10, 25, 0.85)', backdropFilter: 'blur(20px)', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
        <div className="flex flex-col items-center mb-6">
          <CarFront size={56} className="text-purple-500 mb-2" />
          <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-500">
             {isSignup ? "Create Account" : "Access Portal"}
          </h2>
        </div>

        <form onSubmit={isSignup ? handleSignup : handleLogin} className="flex flex-col gap-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setRole("customer")}
              className={`btn flex-1 flex items-center gap-2 justify-center ${role === "customer" ? "bg-purple-600 text-white" : "btn-secondary"}`}
            >
              <User size={18} /> Customer
            </button>
            <button
              type="button"
              onClick={() => setRole("driver")}
              className={`btn flex-1 flex items-center gap-2 justify-center ${role === "driver" ? "bg-purple-600 text-white" : "btn-secondary"}`}
            >
              <CarFront size={18} /> Driver
            </button>
          </div>

          {isSignup && (
              <>
                 <input type="text" placeholder="Full Name" className="input-field" value={name} onChange={e => setName(e.target.value)} required />
                 <div className="flex gap-2">
                    <input type="number" placeholder="Age" className="input-field w-1/2" value={age} onChange={e => setAge(e.target.value)} required />
                    <select className="input-field w-1/2" value={gender} onChange={e => setGender(e.target.value)}>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                    </select>
                 </div>
              </>
          )}

          <input
            type="email"
            placeholder="Email Address"
            className="input-field"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="input-field"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {!isSignup && (
             <div className="flex items-center gap-2 mt-2">
                <input type="checkbox" id="keep" checked={keepMeLoggedIn} onChange={e => setKeepMeLoggedIn(e.target.checked)} className="w-4 h-4 cursor-pointer text-purple-600 border-purple-300 rounded focus:ring-purple-500"/>
                <label htmlFor="keep" className="text-gray-300 text-sm cursor-pointer">Keep me logged in for 50 days (Current device)</label>
             </div>
          )}

          <button type="submit" className="btn btn-primary mt-2 flex justify-center py-4 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 w-full text-lg shadow-lg shadow-purple-500/30">
            {isSignup ? "Sign Up Now" : "Authenticate"}
          </button>
        </form>

        <div className="mt-6 text-center text-gray-400">
           {isSignup ? "Already have an account? " : "First time here? "}
           <button onClick={() => setIsSignup(!isSignup)} className="text-purple-400 hover:text-purple-300 font-bold underline">
              {isSignup ? "Log In" : "Register"}
           </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
