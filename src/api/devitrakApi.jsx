import axios from "axios";
import { ConfigEnvExport } from "../config/ConfigEnvExport";

const { devitrack_api, aws_api, header_auth_token } = ConfigEnvExport;

export const devitrakApi = axios.create({
  baseURL: devitrack_api,
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
  baseURL: `${devitrack_api}/admin`,
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
  baseURL: `${devitrack_api}/article`,
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

export const devitrakAWSApi = axios.create({
  baseURL: aws_api,
  headers: {
    "auth-token": header_auth_token
  },
});
