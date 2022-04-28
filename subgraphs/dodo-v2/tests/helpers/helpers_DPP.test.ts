import {
  newMockEvent,
  createMockedFunction
} from "matchstick-as/assembly/index";
import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { DODOSwap } from "../../generated/DPP/DPP";
import { ERC20 } from "../../generated/CP/ERC20";
import { DPP } from "../../generated/DPP/DPP";
import { createERC20Instance, createNewDPPEvent } from "./factory_helpers.test";

export function createDVM(addressDPP: string): DPP {
  let dVm = Address.fromString(addressDPP);
  let version = ethereum.Value.fromString("DPP 1.0.2");

  createMockedFunction(dVm, "version", "version():(string)").returns([version]);

  let dvm = DPP.bind(dVm);
  return dvm;
}

export function createDODOSwapEvent(
  fromToken: string,
  toToken: string,
  fromAmount: i64,
  toAmount: i64,
  trader: string,
  receiver: string
): DODOSwap {
  let newDODOSwapEvent = changetype<DODOSwap>(newMockEvent());
  newDODOSwapEvent.parameters = new Array();

  let ft = new ethereum.EventParam(
    "fromToken",
    ethereum.Value.fromAddress(Address.fromString(fromToken))
  );

  let tt = new ethereum.EventParam(
    "toToken",
    ethereum.Value.fromAddress(Address.fromString(toToken))
  );

  let fa = new ethereum.EventParam(
    "fromAmount",
    ethereum.Value.fromString(fromAmount.toString())
  );

  let ta = new ethereum.EventParam(
    "toAmount",
    ethereum.Value.fromString(toAmount.toString())
  );

  let t = new ethereum.EventParam(
    "trader",
    ethereum.Value.fromAddress(Address.fromString(trader))
  );

  let r = new ethereum.EventParam(
    "receiver",
    ethereum.Value.fromAddress(Address.fromString(receiver))
  );

  newDODOSwapEvent.parameters.push(ft);
  newDODOSwapEvent.parameters.push(tt);
  newDODOSwapEvent.parameters.push(fa);
  newDODOSwapEvent.parameters.push(ta);
  newDODOSwapEvent.parameters.push(t);
  newDODOSwapEvent.parameters.push(r);

  return newDODOSwapEvent;
}
