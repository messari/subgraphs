import {
  newMockEvent,
  createMockedFunction
} from "matchstick-as/assembly/index";
import { Address, BigInt, Bytes, ethereum } from "@graphprotocol/graph-ts";
import { DODOSwap } from "../../generated/DPP/DPP";
import { ERC20 } from "../../generated/CP/ERC20";
import { DPP } from "../../generated/DPP/DPP";
import { TxHash, DPPFactory_ADDRESS } from "./constants.test";

export function createDODOSwapEvent(
  fromToken: string,
  toToken: string,
  fromAmount: string,
  toAmount: string,
  trader: string,
  receiver: string,
  dpp: string
): DODOSwap {
  let newDODOSwapEvent = changetype<DODOSwap>(newMockEvent());
  let dvmAdd = Address.fromString(dpp);
  let token1 = Address.fromString(fromToken);
  let token2 = Address.fromString(toToken);
  let version = ethereum.Value.fromString("DPP 1.0.0");

  newDODOSwapEvent.address = dvmAdd;
  newDODOSwapEvent.transaction.hash = Bytes.fromHexString(TxHash);
  newDODOSwapEvent.logIndex = BigInt.fromString("1");
  createMockedFunction(dvmAdd, "version", "version():(string)").returns([
    version
  ]);

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
    ethereum.Value.fromUnsignedBigInt(BigInt.fromString(fromAmount))
  );

  let ta = new ethereum.EventParam(
    "toAmount",
    ethereum.Value.fromUnsignedBigInt(BigInt.fromString(toAmount))
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
