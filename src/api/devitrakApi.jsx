import axios from "axios";
import { ConfigEnvExport } from "../config/ConfigEnvExport";

const { devitrack_api, aws_api, header_auth_token } = ConfigEnvExport;

// Helper function to get client information (excluding unsafe headers)
const getClientInfo = () => {
  const language = navigator.language;
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  return {
    language,
    timezone,
    timestamp: new Date().toISOString()
  };
};
export const devitrakApi = axios.create({
  baseURL: devitrack_api,
});

devitrakApi.interceptors.request.use((config) => {
  const clientInfo = getClientInfo();
  
  config.headers = {
    ...config.headers,
    "X-Forwarded-For": "", // Will be populated by proxy/load balancer
    "X-Real-IP": "", // Will be populated by proxy/load balancer
    "X-Client-IP": "", // Will be populated by proxy/load balancer
    // Removed "User-Agent" - browsers set this automatically,
    "Accept-Language": clientInfo.language,
    "X-Timezone": clientInfo.timezone,
    "X-Request-Timestamp": clientInfo.timestamp,
    "X-Request-ID": `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  };

  if (localStorage.getItem("admin-token")) {
    config.headers["x-token"] = localStorage.getItem("admin-token");
  }
  
  return config;
});

export const devitrakApiAdmin = axios.create({
  baseURL: `${devitrack_api}/admin`,
  withCredentials: true, // ensure cookies are sent
});

//*config interceptors
devitrakApiAdmin.interceptors.request.use((config) => {
  const clientInfo = getClientInfo();
  
  config.headers = {
    ...config.headers,
    "X-Forwarded-For": "", // Will be populated by proxy/load balancer
    "X-Real-IP": "", // Will be populated by proxy/load balancer
    "X-Client-IP": "", // Will be populated by proxy/load balancer
    "User-Agent": clientInfo.userAgent,
    "Accept-Language": clientInfo.language,
    "X-Timezone": clientInfo.timezone,
    "X-Request-Timestamp": clientInfo.timestamp,
    "X-Request-ID": `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  };

  if (localStorage.getItem("admin-token")) {
    config.headers["x-token"] = localStorage.getItem("admin-token");
  }
  
  return config;
});

export const devitrakApiArticle = axios.create({
  baseURL: `${devitrack_api}/article`,
});

//*config interceptors
devitrakApiArticle.interceptors.request.use((config) => {
  const clientInfo = getClientInfo();
  
  config.headers = {
    ...config.headers,
    "X-Forwarded-For": "", // Will be populated by proxy/load balancer
    "X-Real-IP": "", // Will be populated by proxy/load balancer
    "X-Client-IP": "", // Will be populated by proxy/load balancer
    "User-Agent": clientInfo.userAgent,
    "Accept-Language": clientInfo.language,
    "X-Timezone": clientInfo.timezone,
    "X-Request-Timestamp": clientInfo.timestamp,
    "X-Request-ID": `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  };

  if (localStorage.getItem("admin-token")) {
    config.headers["x-token"] = localStorage.getItem("admin-token");
  }
  
  return config;
});

export const devitrakAWSApi = axios.create({
  baseURL: aws_api,
  headers: {
    "auth-token": header_auth_token
  },
});

// Add interceptor for AWS API as well
devitrakAWSApi.interceptors.request.use((config) => {
  const clientInfo = getClientInfo();
  
  config.headers = {
    ...config.headers,
    "X-Forwarded-For": "", // Will be populated by proxy/load balancer
    "X-Real-IP": "", // Will be populated by proxy/load balancer
    "X-Client-IP": "", // Will be populated by proxy/load balancer
    "User-Agent": clientInfo.userAgent,
    "Accept-Language": clientInfo.language,
    "X-Timezone": clientInfo.timezone,
    "X-Request-Timestamp": clientInfo.timestamp,
    "X-Request-ID": `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  };
  
  return config;
});
