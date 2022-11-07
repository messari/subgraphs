import { DocumentNode, gql } from "@apollo/client";

export const SubgraphStatusQuery = (url: string): DocumentNode => {
  if (url.includes("/name/")) {
    return nameQuery;
  } else {
    return idQuery;
  }
};

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
  query Status($deploymentIds: [String]) {
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

export function getPendingSubgraphsOnProtocolQuery(protocol: any) {
  if (!protocol) {
    return null;
  }
  try {
    const depoKeys = Object.keys(protocol).filter(x => !x.toUpperCase().includes('DECENTRALIZED'));
    if (depoKeys.length > 0) {
      let query = `{`;
      depoKeys.forEach(depo => {
        const slug = protocol[depo].split('name/')[1];
        query += `${slug.split('-').join('_').split('/').join('_')}: indexingStatusForPendingVersion(subgraphName: "${slug}") {
          subgraph
          health
          entityCount
        }`;
      });
      query += ` }`;
      return gql`
        ${query}
        `;
    }
    return null;
  } catch (err: any) {
    console.error(err.message);
    return null;
  }
}