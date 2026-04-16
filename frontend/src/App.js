import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import DriverDashboard from "./pages/DriverDashboard";
import CustomerDashboard from "./pages/CustomerDashboard";

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/driver" element={<DriverDashboard />} />
        <Route path="/customer" element={<CustomerDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;