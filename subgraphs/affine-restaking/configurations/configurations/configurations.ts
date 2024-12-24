import { log } from "@graphprotocol/graph-ts";

import { Configurations } from "./interface";
import { Deploy } from "./deploy";
import { AffineRestakingEthereumConfigurations } from "../../protocols/affine-restaking/config/deployments/affine-restaking-ethereum/configurations";
import { AffineRestakingLineaConfigurations } from "../../protocols/affine-restaking/config/deployments/affine-restaking-linea/configurations";

export function getNetworkConfigurations(deploy: i32): Configurations {
  switch (deploy) {
    case Deploy.AFFINE_RESTAKING_ETHEREUM: {
      return new AffineRestakingEthereumConfigurations();
    }
    case Deploy.AFFINE_RESTAKING_LINEA: {
      return new AffineRestakingLineaConfigurations();
    }
    default: {
      log.critical(
        "No configurations found for deployment protocol/network",
        []
      );
      return new AffineRestakingEthereumConfigurations();
    }
  }
}
