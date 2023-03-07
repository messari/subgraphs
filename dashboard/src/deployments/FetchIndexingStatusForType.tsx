import { NewClient } from "../utils";
import { useEffect, useMemo, useState } from "react";
import { gql, useLazyQuery } from "@apollo/client";
import FetchPendingSubgraphVersion from "./FetchPendingSubgraphVersion";

interface FetchIndexingStatusForTypeProps {
    slugs: string[];
    setDeployments: any;
}

function FetchIndexingStatusForType({ slugs, setDeployments }: FetchIndexingStatusForTypeProps) {
    const clientIndexing = useMemo(() => NewClient("https://api.thegraph.com/index-node/graphql"), []);
    const [slugsToCheck, setSlugsToCheck] = useState<string[]>([]);

    let fullPendingQueryArray = ["query {"];
    slugs.forEach((slug: string) => {
        fullPendingQueryArray[fullPendingQueryArray.length - 1] += `      
              ${slug
                .split("-")
                .join(
                    "_"
                )}: indexingStatusForPendingVersion(subgraphName: "messari/${slug}") {
                    subgraph
                }
          `;
    });
    fullPendingQueryArray.push("}");
    const [fetchPendingIndexData, {
        data: pendingIndexData,
    }] = useLazyQuery(gql`${fullPendingQueryArray.join("")}`, {
        client: clientIndexing,
    });

    useEffect(() => {
        if (slugs.length > 0) {
            fetchPendingIndexData();
        }
    }, [])

    useEffect(() => {

        if (pendingIndexData) {

            const slugsToQuery: any[] = Object.keys(pendingIndexData).map((protocolKey: string) => {
                const realSlug = protocolKey.split('_').join('-');
                if (pendingIndexData[protocolKey]?.subgraph) {
                    return { slug: realSlug, id: pendingIndexData[protocolKey]?.subgraph };
                }
                return null;
            })
            setSlugsToCheck(slugsToQuery.filter(x => !!x));
        }

    }, [pendingIndexData])

    if (slugsToCheck?.length > 0) {
        return <>{slugsToCheck.map((obj: any) => <FetchPendingSubgraphVersion subgraphEndpoint={"https://api.thegraph.com/subgraphs/id/" + obj.id} slug={obj.slug + " (Pending)"} setDeployments={setDeployments} />)}</>
    }
    return null;
}

export default FetchIndexingStatusForType;