import axios from "axios";
import { ConfigEnvExport } from "../config/ConfigEnvExport";
import { getActiveServerSynchronously, switchServer, initializeActiveServer } from "./serverManager";

const { aws_api, header_auth_token } = ConfigEnvExport;

// Helper function to get client information
const getClientInfo = () => ({
    language: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    timestamp: new Date().toISOString(),
});

const buildBaseURL = (base, suffix) => {
    try {
        const url = new URL(base);
        let combinedPath = `${url.pathname}${suffix}`;

        // Replace multiple slashes (e.g., //) with a single slash
        combinedPath = combinedPath.replace(/\/+/g, '/');

        // Repeatedly replace '/api/api' with '/api' until no duplicates are left.
        while (combinedPath.includes('/api/api')) {
            combinedPath = combinedPath.replace('/api/api', '/api');
        }

        // Assign the cleaned path back to the URL object
        url.pathname = combinedPath;

        // Convert back to string.
        let finalURL = url.toString();

        // Remove trailing slash for consistency, unless it's the root path
        if (finalURL.endsWith('/') && url.pathname !== '/') {
            finalURL = finalURL.slice(0, -1);
        }

        return finalURL;
    } catch (error) {
        console.error("Error building base URL:", error);
        // Fallback to a simple join if URL construction fails
        return `${base}${suffix}`;
    }
};

const createDevitrakApiInstance = (suffix = "") => {
    const instance = axios.create({
        baseURL: buildBaseURL(getActiveServerSynchronously(), suffix),
    });

    // Attach the suffix to the instance for easy access later
    instance.suffix = suffix;

    instance.interceptors.request.use((config) => {
        const clientInfo = getClientInfo();
        config.headers = {
            ...config.headers,
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

    return instance;
};

export const devitrakApi = createDevitrakApiInstance("");
export const devitrakApiAdmin = createDevitrakApiInstance("/admin");
export const devitrakApiArticle = createDevitrakApiInstance("/article");

const instances = [devitrakApi, devitrakApiAdmin, devitrakApiArticle];

export const updateApiInstanceURLs = (newBaseURL) => {
    if (!newBaseURL) return;
    instances.forEach((inst) => {
        inst.defaults.baseURL = buildBaseURL(newBaseURL, inst.suffix);
    });
};

export const configureApi = async () => {
    const healthyServer = await initializeActiveServer();
    updateApiInstanceURLs(healthyServer);
    return healthyServer;
};

const setupResponseInterceptor = (instance) => {
    instance.interceptors.response.use(
        (response) => response,
        async (error) => {
            const { config, message } = error;
            const originalRequest = config;

            if (
                (message.includes("Network Error") || message.includes("timeout")) &&
                !originalRequest._retry
            ) {
                originalRequest._retry = true;
                try {
                    const newBaseURL = await switchServer();
                    // Update the base URL for all API instances
                    updateApiInstanceURLs(newBaseURL);
                    // Retry the request with the instance, which will now use the new base URL
                    return instance(originalRequest);
                } catch (switchError) {
                    console.error("Failed to switch server:", switchError.message);
                    return Promise.reject(error);
                }
            }
            return Promise.reject(error);
        }
    );
};

instances.forEach(setupResponseInterceptor);

// AWS API instance remains unchanged as it has a separate configuration.
export const devitrakAWSApi = axios.create({
  baseURL: aws_api,
  headers: {
      "auth-token": header_auth_token,
  },
});

devitrakAWSApi.interceptors.request.use((config) => {
    const clientInfo = getClientInfo();
  config.headers = {
    ...config.headers,
      ...clientInfo,
  };
  return config;
});
