// import { log} from "@graphprotocol/graph-ts";
import { configurationsMap, getNetworkConfigurations } from "./configurations/configurations";
import { Deploy } from "./configurations/deploy";

// Select the deployment protocol and network
let deployment = Deploy.UNISWAP_V2_MAINNET;

// export const NetworkConfigs = configurationsMap.get(deployment)!
export const NetworkConfigs = getNetworkConfigurations(deployment);
// export const NetworkConfigs = getNetworkConfigurations(currentProtocol, dataSource.network().toUpperCase());