import { styled } from "../styled";
import { NewClient } from "../utils";
import { useEffect, useMemo } from "react";
import { gql, useLazyQuery } from "@apollo/client";

const DeploymentsLayout = styled("div")`
  padding: 0;
`;

interface DecenIndexingCallsProps {
  setDepoIndexingStatus: any;
  decentralizedDepoQuery: any;
  depoIdToSubgraphName: any;
}

function DecenIndexingCalls({
  setDepoIndexingStatus,
  decentralizedDepoQuery,
  depoIdToSubgraphName,
}: DecenIndexingCallsProps) {
  const clientIndexing = useMemo(() => NewClient("https://api.thegraph.com/index-node/graphql"), []);

  // Decentralized deployment query
  const [fetchStatusDecen, { data: statusDecen, loading: statusDecenLoading }] = useLazyQuery(
    gql`
      ${decentralizedDepoQuery}
    `,
    {
      client: clientIndexing,
    },
  );

  useEffect(() => {
    fetchStatusDecen();
  }, []);

  useEffect(() => {
    if (statusDecen) {
      const decenObj: any = {};
      statusDecen.indexingStatuses.forEach((status: any) => {
        decenObj[depoIdToSubgraphName[status.subgraph]] = status;
      });
      setDepoIndexingStatus(decenObj);
    }
  }, [statusDecenLoading]);

  // No need to return a JSX element to render, function needed for state management
  return null;
}

export default DecenIndexingCalls;
