import { test, assert } from "matchstick-as/assembly/index";

import {
  handleBuyShares,
  handleSellShares,
  handleDODOSwapDVM
} from "../src/mappingDVM";

import {
  createBuySharesEvent,
  createSellSharesEvent,
  createDODOSwapDVMEvent
} from "./helpers/helpers_DVM.test";

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

test("Can handle a BuyShares Event", () => {
  let bsEvent = createBuySharesEvent(
    Account1Add,
    "1000000000000000000",
    "1000000000000000000",
    Token1Add,
    Token2Add,
    DVMPoolAddress
  );

  handleBuyShares(bsEvent);
  assert.fieldEquals(
    "LiquidityPool",
    DVMPoolAddress.toLowerCase(),
    "outputTokenSupply",
    "1000000000000000000"
  );
});

test("Can handle a SellShares Event", () => {
  let ssEvent = createSellSharesEvent(
    Account1Add,
    DVMPoolAddress,
    "1000000000000000000",
    "1000000000000000000",
    Token1Add,
    Token2Add,
    DVMPoolAddress
  );

  handleSellShares(ssEvent);

  assert.fieldEquals(
    "LiquidityPool",
    DVMPoolAddress.toLowerCase(),
    "outputTokenSupply",
    "0"
  );
});

test("Can handle a DODOSwap Event", () => {
  let swapEvent = createDODOSwapDVMEvent(
    Token1Add,
    Token2Add,
    "1000000000000000000",
    "1000000000000000000",
    Account1Add,
    Account2Add,
    DVMPoolAddress
  );

  handleDODOSwapDVM(swapEvent);
  let swapID = TxHash + "-" + "1";

  assert.fieldEquals("Swap", swapID, "from", DVMPoolAddress.toLowerCase());
});
