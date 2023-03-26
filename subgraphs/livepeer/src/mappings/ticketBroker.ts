import { WinningTicketRedeemed } from "../../generated/TicketBroker/TicketBroker";
import * as utils from "../common/utils";
import * as constants from "../common/constants";
import { createOrUpdatePool } from "../common/initializers";
import { Bytes } from "@graphprotocol/graph-ts";
export function winningTicketRedeemed(event: WinningTicketRedeemed): void {
  const transcoderAddress = event.params.recipient;
  const ethAmount = event.params.faceValue;
  const sdk = utils.initializeSDK(event);
  const WETH = sdk.Tokens.getOrCreateToken(constants.WETH_ADDRESS);
  createOrUpdatePool(transcoderAddress, event);
  sdk.Pools.loadPool(
    Bytes.fromUTF8(transcoderAddress.toHexString())
  ).addRevenueNative(WETH, constants.BIGINT_ZERO, ethAmount);
}
