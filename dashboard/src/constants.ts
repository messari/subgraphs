export namespace ProtocolType {
  export const EXCHANGE = "EXCHANGE";
  export const LENDING = "LENDING";
  export const YIELD = "YIELD";
  export const BRIDGE = "BRIDGE";
  export const GENERIC = "GENERIC";
}
export namespace Versions {
  export const Schema100 = "1.0.0";
  export const Schema110 = "1.1.0";
  export const Schema120 = "1.2.0";

  // Array to list out the different schema versions available
  export const SchemaVersions = [Schema100, Schema110, Schema120];
}

export const latestSchemaVersion = "1.2.1";
export const PoolName: Record<string, string> = {
  EXCHANGE: "liquidityPool",
  LENDING: "market",
  YIELD: "vault",
};
export const PoolNames: Record<string, string> = {
  EXCHANGE: "liquidityPools",
  LENDING: "markets",
  YIELD: "vaults",
};
export const ProtocolTypeEntity: Record<string, string> = {
  EXCHANGE: "dexAmmProtocols",
  LENDING: "lendingProtocols",
  YIELD: "yieldAggregators",
}
export interface Schema {
  entities: string[];
  entitiesData: { [x: string]: { [x: string]: string } };
  query: string;
  poolData: { [x: string]: string };
  events: string[];
  protocolFields: { [x: string]: string };
}
export const ProtocolsToQuery: { [name: string]: { [network: string]: { URL: string, deploymentId: string } } } = {
  aaveV2: {
    mainnet: {
      URL: "https://api.thegraph.com/subgraphs/name/messari/aave-v2-ethereum",
      deploymentId: "QmPKdZkohKnLR6dAGrxwfQkkaXULkd1fPK9QTjNRn9WNFu"
    }
  },
  abracadabra: {
    mainnet: {
      URL: "https://api.thegraph.com/subgraphs/name/messari/abracadabra-money",
      deploymentId: "QmdPcV35TaQif8pD3Ndg1X85xBzSeZgYuBFayuRJxTeq4C"
    },
    avalanche: {
      URL: "https://api.thegraph.com/subgraphs/name/messari/abracadabra-money-avalanche",
      deploymentId: "QmTzEJdARYXsxVP58yDjhT2BAR5qwcF233hYfqGVqEdi5p"
    },
    bsc: {
      URL: "https://api.thegraph.com/subgraphs/name/messari/abracadabra-money-bsc",
      deploymentId: "QmNqi3ZwSqNF7rkDMLiVWD8an4A8T4XTudn4dK24P9AErE"
    },
    arbitrum: {
      URL: "https://api.thegraph.com/subgraphs/name/messari/abracadabra-money-arbitrum",
      deploymentId: "QmPk2MpWZKf8eJ9cnxNQobSvPfXKdHgmB1YysdFuk36oEf"
    },
    fantom: {
      URL: "https://api.thegraph.com/subgraphs/name/messari/abracadabra-money-fantom",
      deploymentId: "QmSnfGfnusd3S7Kj5xDkyFYf8y4jkCdwZWcc8p82eFmpo5"
    }
  },
  balancerV2: {
    mainnet: {
      URL: "https://api.thegraph.com/subgraphs/name/messari/balancer-v2-ethereum",
      deploymentId: "QmZUDx895H1uSDDKok5J4ktTfEbRgo3XAz1zDH7aG7q9JZ"
    },
    arbitrum: {
      URL: "https://api.thegraph.com/subgraphs/name/messari/balancer-v2-arbitrum",
      deploymentId: "QmNiM2TPYsHbW82q5rWtguVkHEjnronwHkH4PqnwXrMah2"
    },
    matic: {
      URL: "https://api.thegraph.com/subgraphs/name/messari/balancer-v2-polygon",
      deploymentId: "QmVvVTqrCWWMZC2Tz9J4niDYxEdJELBz5QgBq78ALmvE3J"
    }
  },
  bastion: {
    aurora: {
      URL: "https://api.thegraph.com/subgraphs/name/messari/bastion-protocol-aurora",
      deploymentId: "QmNMx5UfvRkQ7C9GKGtXTkckiaCTdZgsz2KZ2M4CGzC9L5"
    }
  },
  moonwell: {
    moonriver: {
      URL: "https://api.thegraph.com/subgraphs/name/messari/moonwell-moonriver",
      deploymentId: "QmVVhi2nSSQWPRVS5x5yrSocp1DQfsCbcBAXjDskVGW8Rc"
    }
  },
  apeswap: {
    matic: {
      URL: "https://api.thegraph.com/subgraphs/name/messari/apeswap-polygon",
      deploymentId: "QmXMrsAYW36VJrouMF7pbmqqMKjxXdxHya7xdF11oVMAmn"
    },
    bsc: {
      URL: "https://api.thegraph.com/subgraphs/name/messari/apeswap-bsc",
      deploymentId: "QmcV6vnFKUYxKyZ6EePtyLp3A3n4bqRhfyxR1ihN5sT1yr"
    }
  },
  uniswapV2: {
    mainnet: {
      URL: "https://api.thegraph.com/subgraphs/name/messari/uniswap-v2",
      deploymentId: "QmbGu3LzNxQDs8JBMGjedPptTTupYFRdSM6ipvM8yYdWV6"
    }
  },
  uniswapV3: {
    mainnet: {
      URL: "https://api.thegraph.com/subgraphs/name/messari/uniswap-v3",
      deploymentId: "QmSwV6kzC4ft5kQExmmuKxcySaaFmh3ogqz4D7TRoB3eWU"
    },
    matic: {
      URL: "https://api.thegraph.com/subgraphs/name/messari/uniswap-v3-polygon",
      deploymentId: "QmTLLZi4geJMRxUAh2JYM7d6Bh4q1rmosyNMzRq3V6PZw2"
    },
    optimism: {
      URL: "https://api.thegraph.com/subgraphs/name/messari/uniswap-v3-optimism",
      deploymentId: "QmbEHGRmQvjdqYLw4LTUQwoCtftaBDSf1eZmbzJAEdjkSa"
    },
    arbitrum: {
      URL: "https://api.thegraph.com/subgraphs/name/messari/uniswap-v3-arbitrum",
      deploymentId: "QmRtrxZzJcJXbkQWDsoZtdjwPaMLk5GrzMdsQBik6QcLSQ"
    }
  },
  compound: {
    mainnet: {
      URL: "https://api.thegraph.com/subgraphs/name/messari/compound-ethereum",
      deploymentId: "QmPZR3KQgkEPkjjCSVq7RQyvNhQSW2jwcZwYUALKMoaLxK"
    }
  },
  liquity: {
    mainnet: {
      URL: "https://api.thegraph.com/subgraphs/name/messari/liquity-ethereum",
      deploymentId: "QmVDFFSB6nqkCJ19AyczAL3frYh6dhBQCenGwZJ72tfgeQ"
    }
  },
  makerDAO: {
    mainnet: {
      URL: "https://api.thegraph.com/subgraphs/name/messari/makerdao-ethereum",
      deploymentId: "QmdJ7JGffDF6swMrpuiEwYKVsGaXp2tpBxDoNBMVgmAy4H"
    }
  },
  beltFinance: {
    bsc: {
      URL: "https://api.thegraph.com/subgraphs/name/messari/belt-finance-bsc",
      deploymentId: "QmdoipvDfXNshvPewRvaEqdmQKYVH7DWYW1uPuaodCNhWs"
    }
  },
  stakeDAO: {
    mainnet: {
      URL: "https://api.thegraph.com/subgraphs/name/messari/stake-dao",
      deploymentId: "QmdBGfW7ZrUchQz5Y2YgZjxr2Va2XYKoGvvjfa9YAsxMoV"
    }
  },
  tokemak: {
    mainnet: {
      URL: "https://api.thegraph.com/subgraphs/name/messari/tokemak",
      deploymentId: "QmQ88aVYtNzykXXWrEZHrkgDLYQqRDV7EyWE2dSUprL6Pc"
    }
  },
  yearnV2: {
    mainnet: {
      URL: "https://api.thegraph.com/subgraphs/name/messari/yearn-v2-ethereum",
      deploymentId: "QmTNeYLvyLHSpTh1bdCmdQAbzUa2gTuvkT3XafcssWbSdi"
    }
  }
}
