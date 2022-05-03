import {
  newMockEvent,
  createMockedFunction
} from "matchstick-as/assembly/index";
import { Address, BigInt, Bytes, ethereum } from "@graphprotocol/graph-ts";
import { BuyShares, SellShares, DODOSwap } from "../../generated/DSP/DSP";
import { ERC20 } from "../../generated/CP/ERC20";
import { DSP } from "../../generated/DSP/DSP";
import { createERC20Instance, createNewDSPEvent } from "./factory_helpers.test";

export function createBuySharesEvent(
  to: string,
  increaseShares: string,
  totalShares: string
): BuyShares {
  let newDVMevent = createNewDSPEvent(
    "0x43dfc4159d86f3a37a5a4b3d4580b888ad7d4ddd",
    "0xc4436fbae6eba5d95bf7d53ae515f8a707bd402a",
    "0x72d220cE168C4f361dD4deE5D826a01AD8598f6C",
    "0x6fdDB76c93299D985f4d3FC7ac468F9A168577A4"
  );

  let newBuySharesEvent = changetype<BuyShares>(newMockEvent());

  let dvmAdd = Address.fromString("0x6fdDB76c93299D985f4d3FC7ac468F9A168577A4");

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
  totalShares: string
): SellShares {
  let newDVMevent = createNewDSPEvent(
    "0x43dfc4159d86f3a37a5a4b3d4580b888ad7d4ddd",
    "0xc4436fbae6eba5d95bf7d53ae515f8a707bd402a",
    "0x72d220cE168C4f361dD4deE5D826a01AD8598f6C",
    "0x6fdDB76c93299D985f4d3FC7ac468F9A168577A4"
  );

  let newSellSharesEvent = changetype<SellShares>(newMockEvent());
  let dvmAdd = Address.fromString("0x6fdDB76c93299D985f4d3FC7ac468F9A168577A4");

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
  receiver: string
): DODOSwap {
  let newDVMevent = createNewDSPEvent(
    "0x43dfc4159d86f3a37a5a4b3d4580b888ad7d4ddd",
    "0xc4436fbae6eba5d95bf7d53ae515f8a707bd402a",
    "0x72d220cE168C4f361dD4deE5D826a01AD8598f6C",
    "0x6fdDB76c93299D985f4d3FC7ac468F9A168577A4"
  );
  let newDODOSwapEvent = changetype<DODOSwap>(newMockEvent());
  let dvmAdd = Address.fromString("0x6fdDB76c93299D985f4d3FC7ac468F9A168577A4");
  let token1 = Address.fromString(fromToken);
  let token2 = Address.fromString(toToken);

  newDODOSwapEvent.address = dvmAdd;
  newDODOSwapEvent.transaction.hash = Bytes.fromHexString(
    "0xed3706c06c19a02844ba17d6d0e141063b9d33c54bdce5843b972cedd1ec4d90"
  );
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

  createMockedFunction(
    Address.fromString(receiver),
    "totalSupply",
    "totalSupply():(uint256)"
  ).returns([
    ethereum.Value.fromUnsignedBigInt(BigInt.fromString("1000000000000000000"))
  ]);

  createMockedFunction(
    Address.fromString(receiver),
    "_MT_FEE_RATE_MODEL_",
    "_MT_FEE_RATE_MODEL_():(address)"
  ).returns([
    ethereum.Value.fromAddress(
      Address.fromString("0x43dfc4159d86f3a37a5a4b3d4580b888ad7d4ddd")
    )
  ]);

  createMockedFunction(
    Address.fromString("0x43dfc4159d86f3a37a5a4b3d4580b888ad7d4ddd"),
    "feeRateImpl",
    "feeRateImpl():(address)"
  ).returns([
    ethereum.Value.fromAddress(
      Address.fromString("0xc4436fbae6eba5d95bf7d53ae515f8a707bd402a")
    )
  ]);

  createMockedFunction(
    Address.fromString("0xc4436fbae6eba5d95bf7d53ae515f8a707bd402a"),
    "_LP_MT_RATIO_",
    "_LP_MT_RATIO_():(uint256)"
  ).returns([
    ethereum.Value.fromUnsignedBigInt(BigInt.fromString("1000000000000000000"))
  ]);

  createMockedFunction(
    Address.fromString("0x43dfc4159d86f3a37a5a4b3d4580b888ad7d4ddd"),
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
