import {
  newMockEvent,
  createMockedFunction
} from "matchstick-as/assembly/index";
import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { Bid } from "../../generated/CP/CP";
import { ERC20 } from "../../generated/CP/ERC20";
import { CP } from "../../generated/CP/CP";
import { createERC20Instance, createNewCPEvent } from "./factory_helpers.test";

export function createDVM(addressDVM: string): CP {
  let dVm = Address.fromString(addressDVM);
  let version = ethereum.Value.fromString("CP 1.0.2");

  createMockedFunction(dVm, "version", "version():(string)").returns([version]);

  let dvm = CP.bind(dVm);
  return dvm;
}
//    event Bid(address to, uint256 amount, uint256 fee);

export function createBidEvent(to: string, amount: i64, fee: i64): Bid {
  let newBuySharesEvent = changetype<Bid>(newMockEvent());
  newBuySharesEvent.parameters = new Array();

  let too = new ethereum.EventParam(
    "to",
    ethereum.Value.fromAddress(Address.fromString(to))
  );

  let amnt = new ethereum.EventParam(
    "amount",
    ethereum.Value.fromString(amount.toString())
  );

  let feee = new ethereum.EventParam(
    "fee",
    ethereum.Value.fromString(fee.toString())
  );

  newBuySharesEvent.parameters.push(too);
  newBuySharesEvent.parameters.push(amnt);
  newBuySharesEvent.parameters.push(feee);

  return newBuySharesEvent;
}
