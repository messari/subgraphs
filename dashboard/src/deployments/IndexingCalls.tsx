import { styled } from "../styled";
import { NewClient } from "../utils";
import { useEffect, useMemo } from "react";
import { gql, useLazyQuery } from "@apollo/client";

const DeploymentsLayout = styled("div")`
  padding: 0;
`;

interface IndexingCallsProps {
    setIndexingStatus: any;
    setPendingIndexingStatus: any;
    indexingStatusQueries: any;
}

function IndexingCalls({ setIndexingStatus, setPendingIndexingStatus, indexingStatusQueries }: IndexingCallsProps) {
    const clientIndexing = useMemo(() => NewClient("https://api.thegraph.com/index-node/graphql"), []);
    let currentQuery = indexingStatusQueries?.fullCurrentQueryArray?.join("");

    // Generate query from subgraphEndpoints
    const [fetchStatus, {
        data: status
    }] = useLazyQuery(gql`${currentQuery}`, {
        client: clientIndexing,
    });

    let pendingQuery = indexingStatusQueries?.fullPendingQueryArray?.join("");
    const [fetchStatusPending, {
        data: statusPending
    }] = useLazyQuery(gql`${pendingQuery}`, {
        client: clientIndexing,
    });

    useEffect(() => {
        if (!status) {
            fetchStatus();
            fetchStatusPending();
        }
    }, [])

    useEffect(() => {
        setIndexingStatus(status)
    }, [status])

    useEffect(() => {
        setPendingIndexingStatus(statusPending)
    }, [statusPending])

    // No need to return a JSX element to render, function needed for state management
    return (null);
}

export default IndexingCalls;