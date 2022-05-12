import { Address, BigInt, Bytes, ethereum } from "@graphprotocol/graph-ts";

import { createMockedFunction, newMockEvent } from "matchstick-as";

import { handleDODOSwapDVM } from "../../src/mappingDVM";

import { handleDODOSwapDSP } from "../../src/mappingDSP";

import { createDODOSwapDSPEvent } from "./helpers_DSP.test";

import { createDODOSwapDVMEvent } from "./helpers_DVM.test";

import { ERC20 } from "../../generated/CP/ERC20";
import {
  handleNewDVM,
  handleNewCP,
  handleNewDPP,
  handleNewDSP
} from "../../src/mappingFactory";

import {
  createNewDVMEvent,
  createNewDSPEvent,
  createNewDPPEvent,
  createNewCPEvent
} from "./factory_helpers.test";

import {
  Account1Add,
  Account2Add,
  Token1Add,
  Token2Add,
  Token3Add,
  Token4Add,
  DODOLpToken_ADDRESS,
  vDODOToken_ADDRESS,
  WRAPPED_ETH,
  DAI,
  USDC,
  USDT,
  DVMPoolAddress,
  DSPPoolAddress,
  DPPPoolAddress,
  CPPoolAddress,
  DVMFactory_ADDRESS,
  CPFactory_ADDRESS,
  DPPFactory_ADDRESS,
  DSPFactory_ADDRESS,
  TxHash
} from "./constants.test";

export function createERC20Instance(
  tokenAdd: string,
  namei: string,
  symboli: string,
  decimalsi: i32
): ERC20 {
  let erc20Base = Address.fromString(tokenAdd);
  let name = ethereum.Value.fromString(namei);
  let symbol = ethereum.Value.fromString(symboli);
  let decimals = ethereum.Value.fromI32(decimalsi);

  createMockedFunction(erc20Base, "name", "name():(string)").returns([name]);
  createMockedFunction(erc20Base, "symbol", "symbol():(string)").returns([
    symbol
  ]);
  createMockedFunction(erc20Base, "decimals", "decimals():(uint8)").returns([
    decimals
  ]);

  createMockedFunction(
    erc20Base,
    "totalSupply",
    "totalSupply():(uint256)"
  ).returns([
    ethereum.Value.fromUnsignedBigInt(BigInt.fromString("1000000000000000000"))
  ]);

  createMockedFunction(
    erc20Base,
    "_MT_FEE_RATE_MODEL_",
    "_MT_FEE_RATE_MODEL_():(address)"
  ).returns([ethereum.Value.fromAddress(erc20Base)]);

  createMockedFunction(
    erc20Base,
    "feeRateImpl",
    "feeRateImpl():(address)"
  ).returns([ethereum.Value.fromAddress(erc20Base)]);

  createMockedFunction(
    erc20Base,
    "_LP_MT_RATIO_",
    "_LP_MT_RATIO_():(uint256)"
  ).returns([
    ethereum.Value.fromUnsignedBigInt(BigInt.fromString("1000000000000000000"))
  ]);

  createMockedFunction(erc20Base, "getFeeRate", "getFeeRate(address):(uint256)")
    .withArgs([ethereum.Value.fromAddress(Address.fromString(Account1Add))])
    .returns([
      ethereum.Value.fromUnsignedBigInt(BigInt.fromString("10000000000000000"))
    ]);

  createMockedFunction(erc20Base, "getFeeRate", "getFeeRate(address):(uint256)")
    .withArgs([ethereum.Value.fromAddress(Address.fromString(Account2Add))])
    .returns([
      ethereum.Value.fromUnsignedBigInt(BigInt.fromString("10000000000000000"))
    ]);

  createMockedFunction(erc20Base, "balanceOf", "balanceOf(address):(uint256)")
    .withArgs([ethereum.Value.fromAddress(Address.fromString(Account1Add))])
    .returns([
      ethereum.Value.fromUnsignedBigInt(BigInt.fromString("10000000000000000"))
    ]);

  createMockedFunction(erc20Base, "balanceOf", "balanceOf(address):(uint256)")
    .withArgs([ethereum.Value.fromAddress(Address.fromString(Account2Add))])
    .returns([
      ethereum.Value.fromUnsignedBigInt(BigInt.fromString("10000000000000000"))
    ]);

  createMockedFunction(erc20Base, "balanceOf", "balanceOf(address):(uint256)")
    .withArgs([ethereum.Value.fromAddress(Address.fromString(DVMPoolAddress))])
    .returns([
      ethereum.Value.fromUnsignedBigInt(BigInt.fromString("10000000000000000"))
    ]);

  createMockedFunction(erc20Base, "balanceOf", "balanceOf(address):(uint256)")
    .withArgs([ethereum.Value.fromAddress(Address.fromString(DSPPoolAddress))])
    .returns([
      ethereum.Value.fromUnsignedBigInt(BigInt.fromString("10000000000000000"))
    ]);

  createMockedFunction(erc20Base, "balanceOf", "balanceOf(address):(uint256)")
    .withArgs([ethereum.Value.fromAddress(Address.fromString(DPPPoolAddress))])
    .returns([
      ethereum.Value.fromUnsignedBigInt(BigInt.fromString("10000000000000000"))
    ]);

  createMockedFunction(erc20Base, "balanceOf", "balanceOf(address):(uint256)")
    .withArgs([ethereum.Value.fromAddress(Address.fromString(CPPoolAddress))])
    .returns([
      ethereum.Value.fromUnsignedBigInt(BigInt.fromString("10000000000000000"))
    ]);
  let erc20 = ERC20.bind(erc20Base);
  return erc20;
}

export function simulateActivity(): void {
  let tokenDAI = createERC20Instance(DAI, "Input Base Token Name", "IBTN", 18);

  let tokenUSDC = createERC20Instance(
    USDC,
    "Input Quote Token Name",
    "IQTN",
    6
  );

  let tokenUSDT = createERC20Instance(USDT, "DODO", "vDODOToken_ADDRESS", 18);

  let tokenwETH = createERC20Instance(
    WRAPPED_ETH,
    "Wrapped Ethereum",
    "wETH",
    18
  );

  let tokenb = createERC20Instance(
    Token1Add,
    "Input Base Token Name",
    "IBTN",
    7
  );

  let tokenq = createERC20Instance(
    Token2Add,
    "Input Quote Token Name",
    "IQTN",
    3
  );

  let dodo = createERC20Instance(
    DODOLpToken_ADDRESS,
    "DODO",
    "vDODOToken_ADDRESS",
    18
  );

  let dppT = createERC20Instance(
    DPPPoolAddress,
    "DODO",
    "vDODOToken_ADDRESS",
    18
  );

  let cpT = createERC20Instance(
    CPPoolAddress,
    "DODO",
    "vDODOToken_ADDRESS",
    18
  );

  let vDodo = createERC20Instance(vDODOToken_ADDRESS, "vDODO", "vDODO", 18);

  let newDVMevent = createNewDVMEvent(
    Token1Add,
    Token2Add,
    Account1Add,
    DVMPoolAddress
  );

  handleNewDVM(newDVMevent);

  let newDSPevent = createNewDSPEvent(
    Token1Add,
    Token2Add,
    Account1Add,
    DSPPoolAddress
  );

  handleNewDSP(newDSPevent);

  let newDPPevent = createNewDPPEvent(
    Token1Add,
    Token2Add,
    Account1Add,
    DPPPoolAddress
  );

  handleNewDPP(newDPPevent);

  let newCPevent = createNewCPEvent(
    Token1Add,
    Token2Add,
    Account1Add,
    CPPoolAddress
  );
  handleNewCP(newCPevent);

  //create trades to set prices
  let swapEventDSP = createDODOSwapDSPEvent(
    DAI,
    USDC,
    "1000000000000000000", // DAI
    "1000000", //USDC w/6 Decimals
    Account1Add,
    Account2Add,
    DSPPoolAddress
  );
  //pay 100 DAI for 1 wETH token
  let swapEventDVM = createDODOSwapDVMEvent(
    DAI, //fromToken
    WRAPPED_ETH, //toToken
    "100000000000000000000", //100 dai fromAmount
    "1000000000000000000", //1 wETH toAmount
    Account1Add, //trader
    Account2Add, //receiver
    DVMPoolAddress //pool add
  );

  //pay 1 wETH for 100 ERC20 tokens
  let swapEventDVM1 = createDODOSwapDVMEvent(
    WRAPPED_ETH, //fromToken
    Token1Add, //toToken
    "1000000000000000000", //1 wETH fromAmount
    "1000000000", // 100 ERC20 toAmount
    Account1Add, //trader
    Account2Add, //receiver
    DVMPoolAddress //pool add
  );

  //pay 1 wETH for 100 ERC20 tokens
  let swapEventDVM2 = createDODOSwapDVMEvent(
    WRAPPED_ETH, //fromToken
    Token2Add, //toToken
    "1000000000000000000", //1 wETH fromAmount
    "100000", // 100 ERC20 toAmount
    Account1Add, //trader
    Account2Add, //receiver
    DVMPoolAddress //pool add
  );

  //Handle that shit
  handleDODOSwapDSP(swapEventDSP);
  handleDODOSwapDVM(swapEventDVM);
  handleDODOSwapDVM(swapEventDVM1);
  handleDODOSwapDVM(swapEventDVM2);
}
