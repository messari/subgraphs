import { gql } from "@apollo/client";

export const SubgraphStatusQuery = gql`query Status($deploymentIds: [String]){
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
  }`