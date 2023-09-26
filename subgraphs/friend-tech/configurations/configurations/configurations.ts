import { log } from "@graphprotocol/graph-ts";

import { Configurations } from "./interface";
import { Deploy } from "./deploy";
import { FriendTechBaseConfigurations } from "../../protocols/friend-tech/config/deployments/friend-tech-base/configurations";

export function getNetworkConfigurations(deploy: i32): Configurations {
  switch (deploy) {
    case Deploy.FRIEND_TECH_BASE: {
      return new FriendTechBaseConfigurations();
    }
    default: {
      log.critical(
        "No configurations found for deployment protocol/network",
        []
      );
      return new FriendTechBaseConfigurations();
    }
  }
}
