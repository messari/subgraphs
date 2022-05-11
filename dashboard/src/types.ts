export interface DeploymentConfig {
    URL: string;
    deploymentId: string;
  }
  
  interface StatusChain {
    network: string;
    chainHeadBlock: {
      number: number;
    };
    earliestBlock: {
      number: number;
    };
    latestBlock: {
      number: number;
    };
    lastHealthyBlock: {
      number: number;
    };
  }
  
  interface FatalStatusError {
    message: string;
    block: {
      number: number;
      hash: string;
    };
  }
  
  export interface SubgraphStatus {
    network: string;
    chains: StatusChain[];
    entityCount: string;
    fatalError: FatalStatusError;
    health: string;
    node: string;
    nonFatalErrors: any[];
    subgraph: string;
    synced: boolean;
  }