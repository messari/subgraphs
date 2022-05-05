import {
  newMockEvent,
  createMockedFunction
} from "matchstick-as/assembly/index";
import { Address, BigInt, Bytes, ethereum } from "@graphprotocol/graph-ts";
import { BuyShares, SellShares, DODOSwap } from "../../generated/DVM/DVM";
import { createNewDVMEvent } from "./factory_helpers.test";

import { TxHash } from "./constants.test";

export function createBuySharesEvent(
  to: string,
  increaseShares: string,
  totalShares: string,
  baseToken: string,
  quoteToken: string,
  dvm: string
): BuyShares {
  let newDVMevent = createNewDVMEvent(baseToken, quoteToken, to, dvm);

  let newBuySharesEvent = changetype<BuyShares>(newMockEvent());

  let dvmAdd = Address.fromString(dvm);

  newBuySharesEvent.address = dvmAdd;

  createMockedFunction(dvmAdd, "balanceOf", "balanceOf(address):(uint256)")
    .withArgs([ethereum.Value.fromAddress(dvmAdd)])
    .returns([
      ethereum.Value.fromUnsignedBigInt(BigInt.fromString(totalShares))
    ]);

  newBuySharesEvent.parameters = new Array();

  let too = new ethereum.EventParam(
    "to",
    ethereum.Value.fromAddress(Address.fromString(to))
  );

  let increaseSharess = new ethereum.EventParam(
    "increaseShares",
    ethereum.Value.fromUnsignedBigInt(BigInt.fromString(increaseShares))
  );

  let totalSharess = new ethereum.EventParam(
    "totalShares",
    ethereum.Value.fromUnsignedBigInt(BigInt.fromString(totalShares))
  );

  newBuySharesEvent.parameters.push(too);
  newBuySharesEvent.parameters.push(increaseSharess);
  newBuySharesEvent.parameters.push(totalSharess);

  return newBuySharesEvent;
}

export function createSellSharesEvent(
  payer: string,
  to: string,
  decreaseShares: string,
  totalShares: string,
  baseToken: string,
  quoteToken: string,
  dvm: string
): SellShares {
  let newDVMevent = createNewDVMEvent(baseToken, quoteToken, to, dvm);

  let newSellSharesEvent = changetype<SellShares>(newMockEvent());
  let dvmAdd = Address.fromString(dvm);

  newSellSharesEvent.address = dvmAdd;

  createMockedFunction(dvmAdd, "balanceOf", "balanceOf(address):(uint256)")
    .withArgs([ethereum.Value.fromAddress(dvmAdd)])
    .returns([
      ethereum.Value.fromUnsignedBigInt(BigInt.fromString(totalShares))
    ]);
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
    ethereum.Value.fromUnsignedBigInt(BigInt.fromString(decreaseShares))
  );

  let totalSharess = new ethereum.EventParam(
    "totalShares",
    ethereum.Value.fromUnsignedBigInt(BigInt.fromString(totalShares))
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
  fromAmount: string,
  toAmount: string,
  trader: string,
  receiver: string,
  dvm: string
): DODOSwap {
  let newDVMevent = createNewDVMEvent(fromToken, toToken, receiver, dvm);

  let newDODOSwapEvent = changetype<DODOSwap>(newMockEvent());
  let dvmAdd = Address.fromString(dvm);
  let token1 = Address.fromString(fromToken);
  let token2 = Address.fromString(toToken);

  newDODOSwapEvent.address = dvmAdd;
  newDODOSwapEvent.transaction.hash = Bytes.fromHexString(TxHash);
  newDODOSwapEvent.logIndex = BigInt.fromString("1");

  createMockedFunction(token1, "balanceOf", "balanceOf(address):(uint256)")
    .withArgs([ethereum.Value.fromAddress(Address.fromString(receiver))])
    .returns([
      ethereum.Value.fromUnsignedBigInt(
        BigInt.fromString("1000000000000000000")
      )
    ]);
  createMockedFunction(token2, "balanceOf", "balanceOf(address):(uint256)")
    .withArgs([ethereum.Value.fromAddress(Address.fromString(receiver))])
    .returns([
      ethereum.Value.fromUnsignedBigInt(
        BigInt.fromString("1000000000000000000")
      )
    ]);

  createMockedFunction(token1, "balanceOf", "balanceOf(address):(uint256)")
    .withArgs([ethereum.Value.fromAddress(Address.fromString(dvm))])
    .returns([
      ethereum.Value.fromUnsignedBigInt(
        BigInt.fromString("1000000000000000000")
      )
    ]);
  createMockedFunction(token2, "balanceOf", "balanceOf(address):(uint256)")
    .withArgs([ethereum.Value.fromAddress(Address.fromString(dvm))])
    .returns([
      ethereum.Value.fromUnsignedBigInt(
        BigInt.fromString("1000000000000000000")
      )
    ]);

  createMockedFunction(
    Address.fromString(dvm),
    "totalSupply",
    "totalSupply():(uint256)"
  ).returns([
    ethereum.Value.fromUnsignedBigInt(BigInt.fromString("1000000000000000000"))
  ]);

  createMockedFunction(
    Address.fromString(dvm),
    "_MT_FEE_RATE_MODEL_",
    "_MT_FEE_RATE_MODEL_():(address)"
  ).returns([ethereum.Value.fromAddress(Address.fromString(dvm))]);

  createMockedFunction(
    Address.fromString(dvm),
    "feeRateImpl",
    "feeRateImpl():(address)"
  ).returns([ethereum.Value.fromAddress(Address.fromString(dvm))]);

  createMockedFunction(
    Address.fromString(dvm),
    "_LP_MT_RATIO_",
    "_LP_MT_RATIO_():(uint256)"
  ).returns([
    ethereum.Value.fromUnsignedBigInt(BigInt.fromString("1000000000000000000"))
  ]);

  createMockedFunction(
    Address.fromString(dvm),
    "getFeeRate",
    "getFeeRate(address):(uint256)"
  )
    .withArgs([ethereum.Value.fromAddress(Address.fromString(trader))])
    .returns([
      ethereum.Value.fromUnsignedBigInt(BigInt.fromString("10000000000000000"))
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
