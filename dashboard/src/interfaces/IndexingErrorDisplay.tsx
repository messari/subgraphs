import { ApolloClient, HttpLink, InMemoryCache, useQuery } from "@apollo/client";
import { useMemo } from "react";
import { SubgraphStatusQuery } from "../queries/subgraphStatusQuery";

interface IndexingErrorProps {
    subgraphName: string;
}

export const IndexingErrorDisplay = ({ subgraphName }: IndexingErrorProps) => {

    const link = new HttpLink({
        uri: "https://api.thegraph.com/index-node/graphql",
    });
    const client = useMemo(
        () =>
            new ApolloClient({
                link,
                cache: new InMemoryCache(),
            }),
        [],
    );

    const { data: subgraphIndex, error } = useQuery(SubgraphStatusQuery, {
        variables: { subgraphName },
        client,
    });
    console.log('INDEXER', subgraphIndex, error)
    if (!subgraphIndex) {
        return null;
    }
    const indexed = parseFloat(
        ((subgraphIndex.indexingStatusesForSubgraphName[0].chains[0].latestBlock.number / subgraphIndex.indexingStatusesForSubgraphName[0].chains[0].chainHeadBlock.number) * 100).toFixed(2),
    );
    return (<>
        <h2 style={{ textAlign: "center", color: "red" }}>INDEXING ERROR - CANNOT COMPLETE QUERY</h2>
        <div
            style={{
                border: "red 2px solid",
                padding: "1%",
                margin: "4%",
                width: "90%",
                cursor: "pointer",
            }}
        >
            <h3 style={{ textAlign: "center", color: "red" }}>
                {subgraphName}
            </h3>
            <p>Entity count: {subgraphIndex.indexingStatusesForSubgraphName[0].entityCount}</p>
            <p style={{ color: "red" }}>Indexed: {indexed}%</p>
            <p>
                {subgraphIndex.indexingStatusesForSubgraphName[0].fatalError ? (
                    <>
                        <span style={{ color: "red" }}>
                            Fatal Error - Execution Stopped at block {subgraphIndex.indexingStatusesForSubgraphName[0].fatalError.block.number}
                        </span>{" "}
                        -{" "}
                        <span>
                            <b>"{subgraphIndex.indexingStatusesForSubgraphName[0].fatalError.message}..."</b>
                        </span>
                    </>
                ) : (
                    <span>Latest Block: {subgraphIndex.indexingStatusesForSubgraphName[0].chains[0].latestBlock.number}</span>
                )}
            </p>
            <p>
                Network: {subgraphIndex.indexingStatusesForSubgraphName[0].chains[0].network} - Current chain block: {subgraphIndex.indexingStatusesForSubgraphName[0].chains[0].chainHeadBlock.number}
            </p>
            <p>Non fatal error count: {subgraphIndex.indexingStatusesForSubgraphName[0].nonFatalErrors.length}</p>
        </div>
    </>);
}