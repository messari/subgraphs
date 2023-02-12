import { NewClient } from "../utils";
import { useEffect, useMemo } from "react";
import { gql, useLazyQuery } from "@apollo/client";
import { ProtocolQuery } from "../queries/protocolQuery";
import { getPendingSubgraphId, SubgraphStatusQuery } from "../queries/subgraphStatusQuery";
import FetchPendingSubgraphVersion from "./FetchPendingSubgraphVersion";

interface FetchSubgraphVersionProps {
    subgraphEndpoint: string;
    slug: string;
    queryString: string;
    setDeployments: any;
}

function FetchSubgraphVersion({ subgraphEndpoint, slug, queryString, setDeployments }: FetchSubgraphVersionProps) {
    const client = useMemo(() => NewClient(subgraphEndpoint), []);
    const clientIndexing = useMemo(() => NewClient("https://api.thegraph.com/index-node/graphql"), []);

    // Generate query from subgraphEndpoints
    const [fetchProtocolMeta, {
        data: protocolMetaData,
        error: protocolMetaError
    }] = useLazyQuery(gql`${ProtocolQuery}`, {
        client: client,
    });

    const [fetchPendingIndexData, {
        data: pendingIndexData,
    }] = useLazyQuery(getPendingSubgraphId, {
        variables: { subgraphName: queryString },
        client: clientIndexing,
    });

    useEffect(() => {
        fetchProtocolMeta();
        if (queryString) {
            fetchPendingIndexData();
        }
    }, [])

    useEffect(() => {
        if (protocolMetaData?.protocols) {
            if (protocolMetaData?.protocols?.length > 0) {
                setDeployments((prevState: any) => ({ ...prevState, [slug]: protocolMetaData.protocols[0].subgraphVersion }));
            }
        }
    }, [protocolMetaData])

    useEffect(() => {
        if (!!protocolMetaError) {
            setDeployments((prevState: any) => ({ ...prevState, [slug]: protocolMetaError?.message || null }));
        }
    }, [protocolMetaError])

    // No need to return a JSX element to render, function needed for state management
    if (pendingIndexData?.indexingStatusForPendingVersion?.subgraph) {
        return <FetchPendingSubgraphVersion subgraphEndpoint={"https://api.thegraph.com/subgraphs/id/" + pendingIndexData?.indexingStatusForPendingVersion?.subgraph} slug={slug + " (Pending)"} setDeployments={setDeployments} />
    }
    return null;
}

export default FetchSubgraphVersion;