import { useEffect } from "react";
import { prometheusClient } from "@dalaillama/shared-utils";
import { appConfig } from "@dalaillama/shared-config";

export const useMetricsHeartbeat = () => {
  useEffect(() => {
    prometheusClient.pushHeartbeat();
    const id = setInterval(() => prometheusClient.pushHeartbeat(), appConfig.METRICS_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);
};
