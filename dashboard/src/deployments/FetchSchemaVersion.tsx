import { NewClient } from "../utils";
import { useEffect, useMemo } from "react";
import { gql, useLazyQuery } from "@apollo/client";
import { ProtocolQuery } from "../queries/protocolQuery";

interface FetchSchemaVersionProps {
    subgraphEndpoint: string;
    slug: string;
    setSchemaDeployments: any;
}

function FetchSchemaVersion({ subgraphEndpoint, slug, setSchemaDeployments }: FetchSchemaVersionProps) {
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
                setSchemaDeployments((prevState: any) => ({ ...prevState, [slug]: protocolMetaData.protocols[0].schemaVersion }));
            }
        }
    }, [protocolMetaData])

    useEffect(() => {
        if (!!protocolMetaError) {
            setSchemaDeployments((prevState: any) => ({ ...prevState, [slug]: null }));
        }
    }, [protocolMetaError])

    // No need to return a JSX element to render, function needed for state management
    return null;
}

export default FetchSchemaVersion;