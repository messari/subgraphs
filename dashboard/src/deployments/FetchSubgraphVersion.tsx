import { NewClient } from "../utils";
import { useEffect, useMemo } from "react";
import { gql, useLazyQuery } from "@apollo/client";
import { ProtocolQuery } from "../queries/protocolQuery";

interface FetchSubgraphVersionProps {
    subgraphEndpoint: string;
    slug: string;
    setDeployments: any;
}

function FetchSubgraphVersion({ subgraphEndpoint, slug, setDeployments }: FetchSubgraphVersionProps) {
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
            setDeployments((prevState: any) => ({ ...prevState, [slug]: null }));
        }
    }, [protocolMetaError])

    // No need to return a JSX element to render, function needed for state management
    return null;
}

export default FetchSubgraphVersion;