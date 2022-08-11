import { gql } from "@apollo/client";

export const subgraphDataQuery = gql`
  query Data($subgraphName: String) {
    subgraph(subgraphName: $subgraphName, accountName: "messari") {
      deployedAt
    }
  }
`;
