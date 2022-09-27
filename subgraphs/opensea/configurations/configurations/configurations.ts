import { log } from "@graphprotocol/graph-ts";
import { OpenSeaV1Configurations } from "../../protocols/opensea-v1/deployments/opensea-v1-ethereum/configurations";
import { OpenSeaV2Configurations } from "../../protocols/opensea-v2/deployments/opensea-v2-ethereum/configurations";
import { Configurations } from "./interface";
import { Deploy } from "./deploy";

// This function is called to load in the proper configurations for a protocol/network deployment.
// To add a new deployment, add a value to the `Deploy` namespace and add a new configuration class to the network specific typescript file in the `protocols` folder.
// Finally, add a new entry for this deployment to the getNetworkConfigurations() function
export function getNetworkConfigurations(deploy: i32): Configurations {
  switch (deploy) {
    case Deploy.OPENSEA_V1_ETHEREUM: {
      return new OpenSeaV1Configurations();
    }
    case Deploy.OPENSEA_V2_ETHEREUM: {
      return new OpenSeaV2Configurations();
    }
    default: {
      log.critical(
        "No configurations found for deployment protocol/network",
        []
      );
      return new OpenSeaV2Configurations();
    }
  }
}
