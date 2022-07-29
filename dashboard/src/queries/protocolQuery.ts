import { gql } from "@apollo/client";

export const ProtocolQuery = gql`
  {
    protocols(subgraphError: allow) {
      type
      schemaVersion
      subgraphVersion
      methodologyVersion
      name
      id
    }
    _meta {
      deployment
    }
  }
`;
