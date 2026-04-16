import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CarFront, User } from "lucide-react";

const Login = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState("customer");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("role", data.user.role);
        
        if (data.user.role === "driver") navigate("/driver");
        else navigate("/customer");
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Development quick access helper wrapper
  const handleDevLogin = (devRole) => {
    localStorage.setItem("token", "dummy-token");
    localStorage.setItem("role", devRole);
    if(devRole === "driver") navigate("/driver");
    else navigate("/customer");
  };

  return (
    <div className="container flex items-center justify-center min-h-[calc(100vh-72px)] mt-8">
      <div className="card" style={{ maxWidth: "400px", width: "100%" }}>
        <div className="flex flex-col items-center mb-6">
          <CarFront size={48} color="var(--primary-color)" />
          <h2 className="mt-4">Welcome Back</h2>
          <p style={{ color: "var(--text-light)" }}>Sign in to continue</p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setRole("customer")}
              className={`btn flex-1 flex items-center gap-2 justify-center ${role === "customer" ? "btn-primary" : "btn-secondary"}`}
            >
              <User size={18} /> Customer
            </button>
            <button
              type="button"
              onClick={() => setRole("driver")}
              className={`btn flex-1 flex items-center gap-2 justify-center ${role === "driver" ? "btn-primary" : "btn-secondary"}`}
            >
              <CarFront size={18} /> Driver
            </button>
          </div>

          <input
            type="email"
            placeholder="Email Address"
            className="input-field"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            className="input-field"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button type="submit" className="btn btn-primary mt-4">
            Sign In
          </button>
        </form>
        
        <div className="mt-8 flex flex-col gap-2 border-t pt-4" style={{ borderColor: 'var(--border-color)'}}>
           <p style={{textAlign:"center", color: 'var(--text-light)', fontSize: '14px'}}>Dev fast-login (Bypasses backend check)</p>
           <button onClick={() => handleDevLogin('driver')} className="btn btn-secondary" style={{padding: '8px'}}>Quick Login as Driver</button>
           <button onClick={() => handleDevLogin('customer')} className="btn btn-secondary" style={{padding: '8px'}}>Quick Login as Customer</button>
        </div>
      </div>
    </div>
  );
};

export default Login;
