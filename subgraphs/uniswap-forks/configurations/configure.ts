// import { log} from "@graphprotocol/graph-ts";
import { getNetworkConfigurations } from "./configurations/configurations";
import { Deploy } from "./configurations/deploy";

// Select the deployment protocol and network
let deployment = Deploy.VAPORDEX_AVALANCHE;

// export const NetworkConfigs = configurationsMap.get(deployment)!
export const NetworkConfigs = getNetworkConfigurations(deployment);
