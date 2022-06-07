import { gql } from "@apollo/client";

export const SubgraphStatusQuery = gql`
  query Status($subgraphName: String) {
    indexingStatusForCurrentVersion(subgraphName: $subgraphName) {
      subgraph
      node
      synced
      health
      fatalError {
        message
        block {
          number
          hash
        }
        handler
      }
      nonFatalErrors {
        message
        block {
          number
          hash
        }
        handler
      }
      chains {
        network
        chainHeadBlock {
          number
        }
        earliestBlock {
          number
        }
        latestBlock {
          number
        }
        lastHealthyBlock {
          number
        }
      }
      entityCount
    }
  }
`;
