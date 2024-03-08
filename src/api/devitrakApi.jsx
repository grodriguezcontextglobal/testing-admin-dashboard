import axios from "axios";

const api = import.meta.env.VITE_APP_DEVITRACK_API;
const apiConsumers = import.meta.env.VITE_APP_DEVITRAK_CONSUMER_API

export const devitrakConsumersApi = axios.create({
  baseURL: apiConsumers
})

export const devitrakApi = axios.create({
  baseURL: api,
});

devitrakApi.interceptors.request.use((config) => {
  if (localStorage.getItem("admin-token")) {
    config.headers = {
      "x-token": localStorage.getItem("admin-token"),
    };
  }
  return config;
});

export const devitrakApiAdmin = axios.create({
  baseURL: `${api}/admin`,
});

//*config interceptors
devitrakApiAdmin.interceptors.request.use((config) => {
  if (localStorage.getItem("admin-token")) {
    config.headers = {
      "x-token": localStorage.getItem("admin-token"),
    };
  }
  return config;
});

export const devitrakApiArticle = axios.create({
  baseURL: `${api}/article`,
});

//*config interceptors
devitrakApiArticle.interceptors.request.use((config) => {
  if (localStorage.getItem("admin-token")) {
    config.headers = {
      "x-token": localStorage.getItem("admin-token"),
    };
  }
  return config;
});
