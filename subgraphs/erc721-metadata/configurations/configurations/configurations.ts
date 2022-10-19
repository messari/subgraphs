import { log } from "@graphprotocol/graph-ts";
import { ERC721MetadataConfigurations } from "../../protocols/erc721-metadata/config/deployments/erc721-metadata-ethereum/configurations";
import { ERC721MetadataTop100Configurations } from "../../protocols/erc721-metadata-top100/config/deployments/erc721-metadata-top100-ethereum/configurations";
import { Configurations } from "./interface";
import { Deploy } from "./deploy";

// This function is called to load in the proper configurations for a protocol/network deployment.
// To add a new deployment, add a value to the `Deploy` namespace and add a new configuration class to the network specific typescript file in the `protocols` folder.
// Finally, add a new entry for this deployment to the getNetworkConfigurations() function
export function getNetworkConfigurations(deploy: i32): Configurations {
  switch (deploy) {
    case Deploy.ERC721_METADATA: {
      return new ERC721MetadataConfigurations();
    }
    case Deploy.ERC721_METADATA_TOP100: {
      return new ERC721MetadataTop100Configurations();
    }
    default: {
      log.critical(
        "No configurations found for deployment protocol/network",
        []
      );
      return new ERC721MetadataConfigurations();
    }
  }
}
