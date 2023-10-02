import { NewClient } from "../../utils";
import { useEffect, useMemo } from "react";
import { useLazyQuery } from "@apollo/client";

interface PendingCallsProps {
  query: any;
  setPendingSubgraphData: any;
}

function PendingCalls({ query, setPendingSubgraphData }: PendingCallsProps) {
  const clientPending = useMemo(() => NewClient("https://api.thegraph.com/index-node/graphql"), []);

  // Generate query from subgraphEndpoints
  const [fetchPending, { data: pendingRequest }] = useLazyQuery(query, {
    client: clientPending,
  });

  useEffect(() => {
    fetchPending();
  }, []);

  useEffect(() => {
    if (pendingRequest) {
      const objectToSet: any = {};
      Object.keys(pendingRequest).forEach((key: string) => {
        if (!pendingRequest[key]) {
          return;
        } else {
          const keyArr = key.split("_");
          const chainKey = keyArr[keyArr.length - 1];
          objectToSet[chainKey] = pendingRequest[key];
        }
      });
      setPendingSubgraphData(objectToSet);
    }
  }, [pendingRequest]);
  // No need to return a JSX element to render, function needed for state management
  return null;
}

export default PendingCalls;
