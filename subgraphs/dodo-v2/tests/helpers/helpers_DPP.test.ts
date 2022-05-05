import {
  newMockEvent,
  createMockedFunction
} from "matchstick-as/assembly/index";
import { Address, BigInt, Bytes, ethereum } from "@graphprotocol/graph-ts";
import { DODOSwap } from "../../generated/DPP/DPP";
import { ERC20 } from "../../generated/CP/ERC20";
import { DPP } from "../../generated/DPP/DPP";
import { createNewDPPEvent } from "./factory_helpers.test";
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
  let newDVMevent = createNewDPPEvent(fromToken, toToken, receiver, dpp);

  let newDODOSwapEvent = changetype<DODOSwap>(newMockEvent());
  let dvmAdd = Address.fromString(dpp);
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

  createMockedFunction(
    Address.fromString(DPPFactory_ADDRESS),
    "balanceOf",
    "balanceOf(address):(uint256)"
  )
    .withArgs([
      ethereum.Value.fromAddress(Address.fromString(DPPFactory_ADDRESS))
    ])
    .returns([
      ethereum.Value.fromUnsignedBigInt(
        BigInt.fromString("1000000000000000000")
      )
    ]);

  createMockedFunction(token1, "balanceOf", "balanceOf(address):(uint256)")
    .withArgs([ethereum.Value.fromAddress(Address.fromString(dpp))])
    .returns([
      ethereum.Value.fromUnsignedBigInt(
        BigInt.fromString("1000000000000000000")
      )
    ]);
  createMockedFunction(token2, "balanceOf", "balanceOf(address):(uint256)")
    .withArgs([ethereum.Value.fromAddress(Address.fromString(dpp))])
    .returns([
      ethereum.Value.fromUnsignedBigInt(
        BigInt.fromString("1000000000000000000")
      )
    ]);

  createMockedFunction(
    Address.fromString(dpp),
    "totalSupply",
    "totalSupply():(uint256)"
  ).returns([
    ethereum.Value.fromUnsignedBigInt(BigInt.fromString("1000000000000000000"))
  ]);

  createMockedFunction(
    Address.fromString(dpp),
    "_MT_FEE_RATE_MODEL_",
    "_MT_FEE_RATE_MODEL_():(address)"
  ).returns([ethereum.Value.fromAddress(Address.fromString(dpp))]);

  createMockedFunction(
    Address.fromString(dpp),
    "feeRateImpl",
    "feeRateImpl():(address)"
  ).returns([ethereum.Value.fromAddress(Address.fromString(dpp))]);

  createMockedFunction(
    Address.fromString(dpp),
    "_LP_MT_RATIO_",
    "_LP_MT_RATIO_():(uint256)"
  ).returns([
    ethereum.Value.fromUnsignedBigInt(BigInt.fromString("1000000000000000000"))
  ]);

  createMockedFunction(
    Address.fromString(dpp),
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
