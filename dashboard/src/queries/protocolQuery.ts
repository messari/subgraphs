import { gql } from "@apollo/client";

export const ProtocolQuery = gql`
  {
    protocols {
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
