import { log } from "@graphprotocol/graph-ts";

import { Configurations } from "./interface";
import { Deploy } from "./deploy";
import { ImpermaxMainnetConfigurations } from "../../protocols/impermax-finance/config/deployments/impermax-finance-ethereum/configurations";
import { ImpermaxArbitrumConfigurations } from "../../protocols/impermax-finance/config/deployments/impermax-finance-arbitrum/configurations";
import { ImpermaxAvalancheConfigurations } from "../../protocols/impermax-finance/config/deployments/impermax-finance-avalanche/configurations";
import { ImpermaxFantomConfigurations } from "../../protocols/impermax-finance/config/deployments/impermax-finance-fantom/configurations";
import { ImpermaxPolygonConfigurations } from "../../protocols/impermax-finance/config/deployments/impermax-finance-polygon/configurations";
import { ImpermaxZksyncConfigurations } from "../../protocols/impermax-finance/config/deployments/impermax-finance-zksync/configurations";

export function getNetworkConfigurations(deploy: i32): Configurations {
  switch (deploy) {
    case Deploy.IMPERMAX_ETHEREUM: {
      return new ImpermaxMainnetConfigurations();
    }
    case Deploy.IMPERMAX_ARBITRUM: {
      return new ImpermaxArbitrumConfigurations();
    }
    case Deploy.IMPERMAX_AVALANCHE: {
      return new ImpermaxAvalancheConfigurations();
    }
    case Deploy.IMPERMAX_FANTOM: {
      return new ImpermaxFantomConfigurations();
    }
    case Deploy.IMPERMAX_POLYGON: {
      return new ImpermaxPolygonConfigurations();
    }
    case Deploy.IMPERMAX_ZKSYNC: {
      return new ImpermaxZksyncConfigurations();
    }
    default: {
      log.critical(
        "No configurations found for deployment protocol/network",
        []
      );
      return new ImpermaxMainnetConfigurations();
    }
  }
}
