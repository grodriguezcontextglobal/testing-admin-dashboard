import { devitrakApi } from "../../api/devitrakApi";

const clearCacheMemory = async (key) => {
  return await devitrakApi.post("/cache_update/remove-cache", {key: key});
};

export default clearCacheMemory;