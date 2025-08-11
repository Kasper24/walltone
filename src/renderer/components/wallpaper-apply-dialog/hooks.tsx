import React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { client } from "@renderer/lib/trpc.js";

export const useMonitorSelection = (scalingOptions?: { key: string; text: string }[]) => {
  const queryClient = useQueryClient();
  const [selectedMonitors, setSelectedMonitors] = React.useState<Set<string>>(new Set());
  const [monitorScalingMethods, setMonitorScalingMethods] = React.useState<Record<string, string>>(
    {}
  );

  const defaultScalingMethod = scalingOptions?.[0]?.key || "fill";

  const monitorsQuery = useQuery({
    queryKey: ["all-monitors"],
    queryFn: async () => {
      return await client.monitor.search.query();
    },
    staleTime: 1000 * 60 * 1,
  });

  React.useEffect(() => {
    if (monitorsQuery.data && monitorsQuery.data.length > 0) {
      const firstMonitor = monitorsQuery.data[0];
      if (firstMonitor) {
        setSelectedMonitors(new Set([firstMonitor.id]));
        setMonitorScalingMethods({ [firstMonitor.id]: defaultScalingMethod });
      }
    }
  }, [monitorsQuery.data, defaultScalingMethod]);

  const toggleMonitor = React.useCallback(
    (id: string) => {
      setSelectedMonitors((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(id)) {
          newSet.delete(id);
          setMonitorScalingMethods((prevMethods) => {
            const newMethods = { ...prevMethods };
            delete newMethods[id];
            return newMethods;
          });
        } else {
          newSet.add(id);
          setMonitorScalingMethods((prevMethods) => ({
            ...prevMethods,
            [id]: defaultScalingMethod,
          }));
        }
        return newSet;
      });
    },
    [defaultScalingMethod]
  );

  const updateScalingMethod = React.useCallback((id: string, scalingMethod: string) => {
    setMonitorScalingMethods((prev) => ({
      ...prev,
      [id]: scalingMethod,
    }));
  }, []);

  const selectAll = React.useCallback(() => {
    if (monitorsQuery.data) {
      const allnames = monitorsQuery.data.map((monitor) => monitor.id);
      setSelectedMonitors(new Set(allnames));

      const allMethods = allnames.reduce(
        (acc, name) => ({
          ...acc,
          [name]: defaultScalingMethod,
        }),
        {}
      );
      setMonitorScalingMethods(allMethods);
    }
  }, [monitorsQuery.data, defaultScalingMethod]);

  const selectNone = React.useCallback(() => {
    setSelectedMonitors(new Set());
    setMonitorScalingMethods({});
  }, []);

  return {
    ...monitorsQuery,
    selectedMonitors,
    monitorScalingMethods,
    toggleMonitor,
    updateScalingMethod,
    selectAll,
    selectNone,
    retryQuery: () => queryClient.invalidateQueries({ queryKey: ["all-monitors"] }),
  };
};
