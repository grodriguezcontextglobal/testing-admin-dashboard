
import axios from 'axios';

// Assume that the .env file will have these variables.
const PRIMARY_API = (import.meta.env.VITE_APP_DEVITRACK_API || '').trim().replace(/\/$/, '');
const BACKUP_API = (import.meta.env.VITE_APP_DEVITRACK_API_BACKUP || '').trim().replace(/\/$/, '');

// As per user's suggestion, using a health check endpoint.
const HEALTH_CHECK_ENDPOINT = '/health';

// Filter out undefined values if backup is not set and create a prioritized list.
const SERVERS = [PRIMARY_API, BACKUP_API].filter(Boolean);

let activeServer = null;
let activeServerPromise = null;

const checkServerHealth = async (serverUrl) => {
  if (!serverUrl) return false;
  try {
    // Using a timeout to prevent long waits for a non-responsive server.
    const response = await axios.get(`${serverUrl}${HEALTH_CHECK_ENDPOINT}`, { timeout: 5000 });
    return response.status === 200;
  } catch (error) {
    console.error(`Server health check failed for ${serverUrl}:`, error.message);
    return false;
  }
};

const findHealthyServer = async () => {
  // Check in-memory active server first
  if (activeServer && await checkServerHealth(activeServer)) {
    return activeServer;
  }

  // Check localStorage for a previously known healthy server
  const storedServer = localStorage.getItem('activeApiServer');
  if (storedServer && await checkServerHealth(storedServer)) {
    activeServer = storedServer;
    return activeServer;
  }

  // Iterate through the prioritized list of servers to find a healthy one
  for (const server of SERVERS) {
    if (await checkServerHealth(server)) {
      activeServer = server;
      localStorage.setItem('activeApiServer', server);
      return server;
    }
  }

  // If no healthy servers are found, default to the primary API.
  console.warn("No healthy servers found. Defaulting to primary API.");
  activeServer = PRIMARY_API;
  localStorage.setItem('activeApiServer', PRIMARY_API);
  return PRIMARY_API;
};

export const initializeActiveServer = () => {
  if (!activeServerPromise) {
    activeServerPromise = findHealthyServer();
  }
  return activeServerPromise;
};

export const switchServer = async () => {
  console.log("Attempting to switch server...");
  const currentServer = activeServer || localStorage.getItem('activeApiServer') || PRIMARY_API;
  const currentIndex = SERVERS.indexOf(currentServer);

  // Try to find the *next* healthy server in the list
  for (let i = 1; i <= SERVERS.length; i++) {
    const nextIndex = (currentIndex + i) % SERVERS.length;
    const nextServer = SERVERS[nextIndex];
    
    // Avoid re-checking the current server if it's the same
    if (nextServer !== currentServer && await checkServerHealth(nextServer)) {
      activeServer = nextServer;
      localStorage.setItem('activeApiServer', activeServer);
      console.log(`Switched to new active server: ${activeServer}`);
      return activeServer;
    }
  }

  throw new Error("Could not find a healthy backup server.");
};

// Synchronous getter for the initial (pre-check) server URL.
export const getActiveServerSynchronously = () => {
  return localStorage.getItem('activeApiServer') || PRIMARY_API;
};
