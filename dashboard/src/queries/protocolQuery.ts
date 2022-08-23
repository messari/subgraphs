import { gql } from "@apollo/client";

export const ProtocolQuery = gql`
  {
    protocols(subgraphError: allow) {
      type
      slug
      network
      schemaVersion
      subgraphVersion
      methodologyVersion
      name
      id
    }
    _meta {
      deployment
      block {
        number
      }
    }
  }
`;
