import { log } from "@graphprotocol/graph-ts";
import { CometDeployed } from "../../../generated/Configurator/Configurator";
import { Supply } from "../../../generated/templates/Comet/Comet";
import { getOrCreateLendingProtocol } from "../../../src/utils/getters";
import { getProtocolData } from "./constants";

///////////////////////////////
///// Configurator Events /////
///////////////////////////////

export function handleCometDeployed(event: CometDeployed): void {
  const protocol = getOrCreateLendingProtocol(getProtocolData());
}

////////////////////////
///// Comet Events /////
////////////////////////

export function handleSupply(event: Supply): void {
  // TODO: Implement
}
