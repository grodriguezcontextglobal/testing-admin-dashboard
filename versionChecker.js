import { useEffect } from "react";
import { notification } from "antd";

// Function to show the notification
const versionChecker = () => {
  notification.open({
    message: "New Version Available",
    description: `A new version of the app is available. Please refresh the page.`,
    duration: 0, // Keep the notification visible until the user interacts with it
    onClick: () => {
      window.location.reload(true); // Hard refresh the page
    },
    style: {
      width: "20vw",
      cursor: "pointer",
      display: "flex",
      justifyContent: "flex-start",
      alignItems: "center",
    },
  });
};

// Function to fetch the latest version
const fetchLatestVersion = async () => {
  try {
    const response = await fetch("/version.json"); // Adjust the path as needed
    const data = await response.json();
    console.log(data);
    return data.version;
  } catch (error) {
    console.error("Failed to fetch version:", error);
    return null;
  }
};

const useVersionCheck = (currentVersion) => {
  useEffect(() => {
    const checkVersion = async () => {
      const latestVersion = await fetchLatestVersion();
      if (latestVersion && latestVersion !== currentVersion) {
        versionChecker();
      }
    };

    const interval = setInterval(checkVersion, 1000 * 60 * 5); // Check every 5 minutes
    checkVersion(); // Initial check

    return () => clearInterval(interval);
  }, [currentVersion]);
};

export default useVersionCheck;
