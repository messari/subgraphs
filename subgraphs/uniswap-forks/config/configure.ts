import { log, dataSource, TypedMap, BigDecimal } from "@graphprotocol/graph-ts";
import { Protocol } from "../src/common/constants";
import { Configurations } from "./configurations/classes";
import { AllConfigurations } from "./configurations/configurations";
import { UniswapV2Configurations } from "./uniswap-v2/uniswapConfigurations";

// Update Protocol.[] to change the protocol configuration vector.
// Program automatically recognizes network.
let protocol = Protocol.UNISWAP_V2

// Get specific configuration per network per protocol.
let protocolConfigurations = AllConfigurations.get(protocol);
if (!protocolConfigurations) {
    log.critical("No configurations found for protocol: {}", [protocol]);  
}

let protocolNetworkConfigurations = protocolConfigurations!.get(dataSource.network());
if (!protocolNetworkConfigurations) {
    log.critical("No configurations found for protocol/network: {}{}", [protocol, dataSource.network()]);  
}

export const NetworkConfigs = new Configurations(protocolNetworkConfigurations!);