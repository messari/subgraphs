import { gql } from "@apollo/client";

export const decentralizedNetworkSubgraphsQuery = gql`
  {
    graphAccounts(
      where: { id_in: ["0x7e8f317a45d67e27e095436d2e0d47171e7c769f", "0x6fa2bacf752dab6cb6e4b922321f03b4cb61d141"] }
    ) {
      id
      subgraphs {
        id
        currentVersion {
          subgraphDeployment {
            originalName
            ipfsHash
            network {
              id
            }
            signalledTokens
          }
        }
        displayName
      }
    }
  }
`;
