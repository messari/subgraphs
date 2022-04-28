import {
  newMockEvent,
  createMockedFunction
} from "matchstick-as/assembly/index";
import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { BuyShares, SellShares, DODOSwap } from "../../generated/DSP/DSP";
import { ERC20 } from "../../generated/CP/ERC20";
import { DSP } from "../../generated/DSP/DSP";
import { createERC20Instance, createNewDSPEvent } from "./factory_helpers.test";

export function createDSP(addressDSP: string): DSP {
  let dVm = Address.fromString(addressDSP);
  let version = ethereum.Value.fromString("DSP 1.0.2");

  createMockedFunction(dVm, "version", "version():(string)").returns([version]);

  let dvm = DSP.bind(dVm);
  return dvm;
}

export function createBuySharesEvent(
  to: string,
  increaseShares: i64,
  totalShares: i64
): BuyShares {
  let newBuySharesEvent = changetype<BuyShares>(newMockEvent());
  newBuySharesEvent.parameters = new Array();

  let too = new ethereum.EventParam(
    "to",
    ethereum.Value.fromAddress(Address.fromString(to))
  );

  let increaseSharess = new ethereum.EventParam(
    "increaseShares",
    ethereum.Value.fromString(increaseShares.toString())
  );

  let totalSharess = new ethereum.EventParam(
    "totalShares",
    ethereum.Value.fromString(totalShares.toString())
  );

  newBuySharesEvent.parameters.push(too);
  newBuySharesEvent.parameters.push(increaseSharess);
  newBuySharesEvent.parameters.push(totalSharess);

  return newBuySharesEvent;
}

export function createSellSharesEvent(
  payer: string,
  to: string,
  decreaseShares: i64,
  totalShares: i64
): SellShares {
  let newSellSharesEvent = changetype<SellShares>(newMockEvent());
  newSellSharesEvent.parameters = new Array();

  let payerr = new ethereum.EventParam(
    "payer",
    ethereum.Value.fromAddress(Address.fromString(payer))
  );

  let too = new ethereum.EventParam(
    "to",
    ethereum.Value.fromAddress(Address.fromString(to))
  );

  let decreaseSharess = new ethereum.EventParam(
    "decreaseShares",
    ethereum.Value.fromString(decreaseShares.toString())
  );

  let totalSharess = new ethereum.EventParam(
    "totalShares",
    ethereum.Value.fromString(totalShares.toString())
  );

  newSellSharesEvent.parameters.push(payerr);
  newSellSharesEvent.parameters.push(too);
  newSellSharesEvent.parameters.push(decreaseSharess);
  newSellSharesEvent.parameters.push(totalSharess);

  return newSellSharesEvent;
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
