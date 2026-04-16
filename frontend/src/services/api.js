import axios from "axios";

const API = axios.create({
  baseURL: "https://ride-pool-optimizer-backend.onrender.com"
});

export const createRide = (data, token) => {
  return API.post("/rides", data, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
};