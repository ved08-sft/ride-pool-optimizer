import { Link, useNavigate } from "react-router-dom";
import { CarFront, LogOut } from "lucide-react";

const Navbar = () => {
  const navigate = useNavigate();
  // We'll add actual auth state logic later, for now simulate mock logic
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/login");
  };

  const isAuth = !!localStorage.getItem("token");

  return (
    <nav className="navbar">
      <div className="container">
        <Link to="/" className="logo">
          <CarFront size={28} color="var(--primary-color)" />
          <span>RidePooler</span>
        </Link>
        
        {isAuth && (
          <button onClick={handleLogout} className="btn btn-secondary flex items-center gap-2">
            <LogOut size={18} />
            Logout
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
