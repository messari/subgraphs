import { log } from "@graphprotocol/graph-ts";
import { ERC721HoldersConfigurations } from "../../protocols/erc721-holders/config/deployments/erc721-holders-ethereum/configurations";
import { ERC721HoldersTop100Configurations } from "../../protocols/erc721-holders-top100/config/deployments/erc721-holders-top100-ethereum/configurations";
import { Configurations } from "./interface";
import { Deploy } from "./deploy";

// This function is called to load in the proper configurations for a protocol/network deployment.
// To add a new deployment, add a value to the `Deploy` namespace and add a new configuration class to the network specific typescript file in the `protocols` folder.
// Finally, add a new entry for this deployment to the getNetworkConfigurations() function
export function getNetworkConfigurations(deploy: i32): Configurations {
  switch (deploy) {
    case Deploy.ERC721_HOLDERS: {
      return new ERC721HoldersConfigurations();
    }
    case Deploy.ERC721_HOLDERS_TOP100: {
      return new ERC721HoldersTop100Configurations();
    }
    default: {
      log.critical(
        "No configurations found for deployment protocol/network",
        []
      );
      return new ERC721HoldersConfigurations();
    }
  }
}
