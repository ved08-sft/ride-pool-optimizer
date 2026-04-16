import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api"
});

export const createRide = (data, token) => {
  return API.post("/rides", data, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
};