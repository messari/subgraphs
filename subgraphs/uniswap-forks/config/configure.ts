import { dataSource } from "@graphprotocol/graph-ts";
import { Protocol } from "../src/common/constants";
import { Configurations } from "./configurations/classes";
import { AllConfigurations } from "./configurations/configurations";

// Update Protocol.[] to change the protocol configuration vector.
// Program automatically recognizes network.
let protocol = Protocol.APESWAP

// Get specific configuration per network per protocol.
let configurations = AllConfigurations[protocol][dataSource.network()]

export const NetworkConfigs = new Configurations(configurations);
