import { DocumentNode, gql } from "@apollo/client";

export const SubgraphStatusQuery = (url: string): DocumentNode => {
  if (url.includes("/name/")) {
    return nameQuery;
  } else {
    return idQuery;
  }
}

export const getPendingSubgraphId = gql`
query Status($subgraphName: String) {
  indexingStatusForPendingVersion(subgraphName: $subgraphName) {
    subgraph
    health
    entityCount
  }
}
`;

export const nameQuery = gql`
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
    indexingStatusForPendingVersion(subgraphName: $subgraphName) {
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

export const idQuery = gql`
query Status($deploymentIds: [String]){
  indexingStatuses(subgraphs: $deploymentIds) {
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
