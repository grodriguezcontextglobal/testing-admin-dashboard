import { createPlatformMockRouter } from "./platformMockRouter";

/**
 * An axios adapter that answers from sample data instead of the network.
 * Installed on devitrakApiPlatform only in the dev-server demo mode
 * (PLATFORM_CONSOLE_MOCK). A short delay keeps the loading states visible.
 */
export const createPlatformMockAdapter = ({ now = new Date(), delayMs = 250 } = {}) => {
  const router = createPlatformMockRouter({ now });
  return async (config) => {
    if (delayMs > 0) await new Promise((resolve) => setTimeout(resolve, delayMs));
    const { status, data } = router.handle({
      method: config.method,
      url: config.url,
      params: config.params,
    });
    const response = {
      data,
      status,
      statusText: status === 200 ? "OK" : "Not Found",
      headers: {},
      config,
      request: null,
    };
    if (status >= 400) {
      const error = new Error(`Request failed with status code ${status}`);
      error.response = response;
      error.config = config;
      error.isAxiosError = true;
      throw error;
    }
    return response;
  };
};
