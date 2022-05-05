import {
  newMockEvent,
  createMockedFunction
} from "matchstick-as/assembly/index";
import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { Bid } from "../../generated/CP/CP";
import { ERC20 } from "../../generated/CP/ERC20";
import { CP } from "../../generated/CP/CP";
import { createNewCPEvent } from "./factory_helpers.test";
import { TxHash } from "./constants.test";

export function createBidEvent(
  to: string,
  amount: string,
  fee: string,
  baseToken: string,
  quoteToken: string,
  cp: string
): Bid {
  let newDVMevent = createNewCPEvent(baseToken, quoteToken, to, cp);

  let newBuySharesEvent = changetype<Bid>(newMockEvent());

  let dvmAdd = Address.fromString(cp);

  newBuySharesEvent.address = dvmAdd;

  createMockedFunction(dvmAdd, "balanceOf", "balanceOf(address):(uint256)")
    .withArgs([ethereum.Value.fromAddress(dvmAdd)])
    .returns([ethereum.Value.fromUnsignedBigInt(BigInt.fromString(amount))]);

  newBuySharesEvent.parameters = new Array();

  let too = new ethereum.EventParam(
    "to",
    ethereum.Value.fromAddress(Address.fromString(to))
  );

  let amnt = new ethereum.EventParam(
    "amount",
    ethereum.Value.fromUnsignedBigInt(BigInt.fromString(amount))
  );

  let feee = new ethereum.EventParam(
    "fee",
    ethereum.Value.fromUnsignedBigInt(BigInt.fromString(fee))
  );

  newBuySharesEvent.parameters.push(too);
  newBuySharesEvent.parameters.push(amnt);
  newBuySharesEvent.parameters.push(feee);

  return newBuySharesEvent;
}
