import { styled } from "../styled";
import { JSONToCSVConvertor, NewClient } from "../utils";
import { useEffect, useMemo } from "react";
import { gql, useLazyQuery } from "@apollo/client";
import { queryOnEntity } from "../queries/fetchEntityQuery";


interface FetchEntityCSVProps {
    entityName: string;
    deployment: string;
    protocolType: string;
    schemaVersion: string;
    timestampLt: number;
    timestampGt: number;
    queryURL: string;
    resultsObject: any;
    setResultsObject: any;
}

function FetchEntityCSV({ entityName, deployment, protocolType, schemaVersion, timestampLt, timestampGt, queryURL, resultsObject, setResultsObject }: FetchEntityCSVProps) {
    const query = queryOnEntity(protocolType, schemaVersion, timestampLt, timestampGt, entityName);
    const clientIndexing = useMemo(() => NewClient(queryURL), []);
    // Generate query from subgraphEndpoints
    const [fetchEntity, {
        data: entity,
        loading: entityLoading,
        error: entityError
    }] = useLazyQuery(gql`${query}`, {
        client: clientIndexing,
    });

    useEffect(() => {
        fetchEntity();
    }, []);

    useEffect(() => {
        if (entity) {
            // Convert all instances to csv
            const csv = JSONToCSVConvertor(entity[entityName], deployment + '-' + entityName, deployment + '-' + entityName, false);
            setResultsObject((prevState: any) => ({ ...prevState, [deployment]: csv }));
        }
    }, [entity])

    useEffect(() => {
        if (entityError) {
            setResultsObject((prevState: any) => ({ ...prevState, [deployment]: entityError.message }));
        }
    }, [entityError])

    // No need to return a JSX element to render, function needed for state management
    return (null);
}

export default FetchEntityCSV;