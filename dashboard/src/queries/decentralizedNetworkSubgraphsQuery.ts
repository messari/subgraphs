
import { gql } from "@apollo/client";

export const decentralizedNetworkSubgraphsQuery = gql`
{
    graphAccount(id: "0x7e8f317a45d67e27e095436d2e0d47171e7c769f"){
      subgraphs {
        id
        currentVersion {
            subgraphDeployment {
                schema
                originalName
                ipfsHash
                network {
                    id
                }
            }
        }
      }
    }
}`