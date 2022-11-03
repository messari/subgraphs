import { styled } from "../styled";
import { NewClient } from "../utils";
import { useEffect, useMemo } from "react";
import { gql, useLazyQuery } from "@apollo/client";

const DeploymentsLayout = styled("div")`
  padding: 0;
`;

interface PendingCallsProps {
    query: any;
    pendingSubgraphData: any;
    setPendingSubgraphData: any;
}

function PendingCalls({ query, pendingSubgraphData, setPendingSubgraphData }: PendingCallsProps) {
    const clientPending = useMemo(() => NewClient("https://api.thegraph.com/index-node/graphql"), []);

    // Generate query from subgraphEndpoints
    const [fetchPending, {
        data: pendingRequest,
        loading: pendingRequestLoading,
        error: pendingRequestError
    }] = useLazyQuery(query, {
        client: clientPending,
    });

    useEffect(() => {
        fetchPending();
    }, [])

    useEffect(() => {
        if (pendingRequest) {
            const objectToSet: any = {};
            Object.keys(pendingRequest).forEach((key: string) => {
                if (!pendingRequest[key]) {
                    return;
                } else {
                    const keyArr = key.split('_');
                    const chainKey = keyArr[keyArr.length - 1];
                    objectToSet[chainKey] = pendingRequest[key];
                }
            })
            setPendingSubgraphData(objectToSet);
        }
    }, [pendingRequest])
    // No need to return a JSX element to render, function needed for state management
    return (null);
}

export default PendingCalls;