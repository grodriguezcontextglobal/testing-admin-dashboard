import { useState, useCallback } from "react";

const useBatchProcessor = (
  items,
  processBatch,
  batchSize = 500,
) => {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("idle"); // idle, running, success, error
  const [error, setError] = useState(null);

  const startProcessing = useCallback(async () => {
    if (items.length === 0) {
      setStatus("success");
      setProgress(100);
      return;
    }

    setStatus("running");
    setError(null);
    setProgress(0);

    // const totalBatches = Math.ceil(items.length / batchSize);
    let processedCount = 0;

    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      try {
        await processBatch(batch);
        processedCount += batch.length;
        const currentProgress = Math.round(
          (processedCount / items.length) * 100,
        );
        setProgress(currentProgress);
      } catch (err) {
        setError(`Batch ${i / batchSize + 1} failed: ${err.message}`);
        setStatus("error");
        return;
      }
    }

    setStatus("success");
  }, [items, processBatch, batchSize]);

  const reset = () => {
    setProgress(0);
    setStatus("idle");
    setError(null);
  };

  return { progress, status, error, startProcessing, reset };
};

export default useBatchProcessor;
