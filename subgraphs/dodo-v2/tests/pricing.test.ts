import { test, assert } from "matchstick-as/assembly/index";

import { handleNewDVM, handleNewDSP } from "../src/mappingFactory";

import { handleDODOSwapDVM } from "../src/mappingDVM";

import { handleDODOSwapDSP } from "../src/mappingDSP";

import { createDODOSwapDSPEvent } from "./helpers/helpers_DSP.test";

import { createDODOSwapDVMEvent } from "./helpers/helpers_DVM.test";

import {
  createNewDVMEvent,
  createNewDSPEvent
} from "./helpers/factory_helpers.test";

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
} from "./helpers/constants.test";

test("Accurately records the USD price of a token when it is traded for a stablecoin(18D)", () => {
  //create stablecoin pools
  let newDSPevent = createNewDSPEvent(DAI, USDC, Account1Add, DSPPoolAddress);
  //create DAI/ERC20 token DVM pool
  let newDVMevent = createNewDVMEvent(
    DAI,
    Token1Add,
    Account1Add,
    DVMPoolAddress
  );
  //create trades to set prices
  let swapEventDSP = createDODOSwapDSPEvent(
    DAI,
    USDC,
    "1000000000000000000",
    "1000000000000000000",
    Account1Add,
    Account2Add,
    DSPPoolAddress
  );
  //pay 100 DAI for 1 ERC20 token
  let swapEventDVM = createDODOSwapDVMEvent(
    DAI, //fromToken
    Token1Add, //toToken
    "100000000000000000000", //100 dai  fromAmount
    "1000000000000000000", //1 erc20 toAmount
    Account1Add, //trader
    Account2Add, //receiver
    DVMPoolAddress //pool add
  );

  //Handle that shit
  handleNewDSP(newDSPevent);
  handleNewDVM(newDVMevent);
  handleDODOSwapDSP(swapEventDSP);
  handleDODOSwapDVM(swapEventDVM);

  //assert things
  assert.fieldEquals("Token", DAI.toLowerCase(), "lastPriceUSD", "1");

  assert.fieldEquals("Token", Token1Add.toLowerCase(), "lastPriceUSD", "100");
});

test("Accurately records the USD price of a token when it is traded for wETH(18D)", () => {
  //create stablecoin pools
  let newDSPevent = createNewDSPEvent(DAI, USDC, Account1Add, DSPPoolAddress);
  //create DAI/wETH token DVM pool
  let newDVMevent = createNewDVMEvent(
    DAI,
    WRAPPED_ETH,
    Account1Add,
    DVMPoolAddress
  );
  //create wETH/ERC20 token DVM pool
  let newDVMevent1 = createNewDVMEvent(
    WRAPPED_ETH,
    Token1Add,
    Account1Add,
    DVMPoolAddress
  );

  //create trades to set prices
  let swapEventDSP = createDODOSwapDSPEvent(
    DAI,
    USDC,
    "1000000000000000000", // 1/1 ratio
    "1000000000000000000",
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
    "100000000000000000000", // 100 ERC20 toAmount
    Account1Add, //trader
    Account2Add, //receiver
    DVMPoolAddress //pool add
  );

  //Handle that shit
  handleNewDSP(newDSPevent);
  handleNewDVM(newDVMevent);
  handleNewDVM(newDVMevent1);
  handleDODOSwapDSP(swapEventDSP);
  handleDODOSwapDVM(swapEventDVM);
  handleDODOSwapDVM(swapEventDVM1);

  //assert things
  assert.fieldEquals("Token", WRAPPED_ETH.toLowerCase(), "lastPriceUSD", "100");
  assert.fieldEquals("Token", Token1Add.toLowerCase(), "lastPriceUSD", "1");
});
