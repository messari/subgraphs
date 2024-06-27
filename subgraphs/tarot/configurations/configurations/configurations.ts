import { log } from "@graphprotocol/graph-ts";

import { Configurations } from "./interface";
import { Deploy } from "./deploy";
import { TarotMainnetConfigurations } from "../../protocols/tarot/config/deployments/tarot-ethereum/configurations";
import { TarotArbitrumConfigurations } from "../../protocols/tarot/config/deployments/tarot-arbitrum/configurations";
import { TarotAvalancheConfigurations } from "../../protocols/tarot/config/deployments/tarot-avalanche/configurations";
import { TarotBaseConfigurations } from "../../protocols/tarot/config/deployments/tarot-base/configurations";
import { TarotBscConfigurations } from "../../protocols/tarot/config/deployments/tarot-bsc/configurations";
import { TarotFantomConfigurations } from "../../protocols/tarot/config/deployments/tarot-fantom/configurations";
import { TarotLineaConfigurations } from "../../protocols/tarot/config/deployments/tarot-linea/configurations";
import { TarotOptimismConfigurations } from "../../protocols/tarot/config/deployments/tarot-optimism/configurations";
import { TarotPolygonConfigurations } from "../../protocols/tarot/config/deployments/tarot-polygon/configurations";
import { TarotScrollConfigurations } from "../../protocols/tarot/config/deployments/tarot-scroll/configurations";
import { TarotZksyncConfigurations } from "../../protocols/tarot/config/deployments/tarot-zksync/configurations";

export function getNetworkConfigurations(deploy: i32): Configurations {
  switch (deploy) {
    case Deploy.TAROT_ETHEREUM: {
      return new TarotMainnetConfigurations();
    }
    case Deploy.TAROT_ARBITRUM: {
      return new TarotArbitrumConfigurations();
    }
    case Deploy.TAROT_AVALANCHE: {
      return new TarotAvalancheConfigurations();
    }
    case Deploy.TAROT_BASE: {
      return new TarotBaseConfigurations();
    }
    case Deploy.TAROT_BSC: {
      return new TarotBscConfigurations();
    }
    case Deploy.TAROT_FANTOM: {
      return new TarotFantomConfigurations();
    }
    case Deploy.TAROT_LINEA: {
      return new TarotLineaConfigurations();
    }
    case Deploy.TAROT_OPTIMISM: {
      return new TarotOptimismConfigurations();
    }
    case Deploy.TAROT_POLYGON: {
      return new TarotPolygonConfigurations();
    }
    case Deploy.TAROT_SCROLL: {
      return new TarotScrollConfigurations();
    }
    case Deploy.TAROT_ZKSYNC: {
      return new TarotZksyncConfigurations();
    }
    default: {
      log.critical(
        "No configurations found for deployment protocol/network",
        []
      );
      return new TarotMainnetConfigurations();
    }
  }
}
