import { Bytes } from "@graphprotocol/graph-ts";
import * as constants from "../common/constants";
import { createOrUpdatePool, initializeSDK } from "../common/initializers";
import { WinningTicketRedeemed } from "../../generated/TicketBroker/TicketBroker";

export function handleWinningTicketRedeemed(
  event: WinningTicketRedeemed
): void {
  const transcoderAddress = event.params.recipient;
  const ethAmount = event.params.faceValue;
  const sdk = initializeSDK(event);
  const WETH = sdk.Tokens.getOrCreateToken(constants.WETH_ADDRESS);
  createOrUpdatePool(transcoderAddress, event);
  sdk.Pools.loadPool(
    Bytes.fromUTF8(transcoderAddress.toHexString())
  ).addRevenueNative(WETH, constants.BIGINT_ZERO, ethAmount);
}
