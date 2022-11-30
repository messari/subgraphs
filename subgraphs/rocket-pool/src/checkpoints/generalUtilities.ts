import { ethereum } from "@graphprotocol/graph-ts";
import { RocketPoolProtocol } from "../../generated/schema";
import { ROCKETPOOL_PROTOCOL_ROOT_ID } from "../constants/generalConstants";

class GeneralUtilities {
  /**
   * Loads the Rocket Protocol entity.
   */
  public getRocketPoolProtocolEntity(): RocketPoolProtocol | null {
    return RocketPoolProtocol.load(ROCKETPOOL_PROTOCOL_ROOT_ID);
  }

  /**
   * Extracts the ID that is commonly used to identify an entity based on the given event.
   */
  public extractIdForEntity(event: ethereum.Event): string {
    return event.transaction.hash.toHex() + "-" + event.logIndex.toString();
  }
}
export const generalUtilities = new GeneralUtilities();
