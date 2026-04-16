import { useState } from "react";
import Map from "../components/Map";

const Home = () => {
  const [passengers, setPassengers] = useState([]);
  const [startSim, setStartSim] = useState(false);

  const handleOptimize = () => {
    // sample passengers (simulate backend response)
    const data = [
      { id: 1, pickup_x: 28.61, pickup_y: 77.23, drop_x: 28.65, drop_y: 77.30 },
      { id: 2, pickup_x: 28.65, pickup_y: 77.28, drop_x: 28.70, drop_y: 77.35 },
      { id: 3, pickup_x: 28.70, pickup_y: 77.32, drop_x: 28.75, drop_y: 77.40 }
    ];

    setPassengers(data);
    setStartSim(true);
  };

  return (
    <div>
      <h1>Ride Pooling System</h1>

      <button onClick={handleOptimize}>
        Optimize Ride
      </button>

      <Map passengers={passengers} startSim={startSim} />
    </div>
  );
};

export default Home;