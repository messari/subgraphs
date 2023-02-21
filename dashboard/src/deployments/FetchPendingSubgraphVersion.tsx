import { NewClient } from "../utils";
import { useEffect, useMemo } from "react";
import { gql, useLazyQuery } from "@apollo/client";
import { ProtocolQuery } from "../queries/protocolQuery";

interface FetchPendingSubgraphVersionProps {
    subgraphEndpoint: string;
    slug: string;
    setDeployments: any;
}

function FetchPendingSubgraphVersion({ subgraphEndpoint, slug, setDeployments }: FetchPendingSubgraphVersionProps) {
    const client = useMemo(() => NewClient(subgraphEndpoint), []);
    // Generate query from subgraphEndpoints
    const [fetchProtocolMeta, {
        data: protocolMetaData,
        error: protocolMetaError
    }] = useLazyQuery(gql`${ProtocolQuery}`, {
        client: client,
    });

    useEffect(() => {
        fetchProtocolMeta();
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

    return null;
}

export default FetchPendingSubgraphVersion;