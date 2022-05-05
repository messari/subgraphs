import { test, assert } from "matchstick-as/assembly/index";

import {
  handleBuyShares,
  handleSellShares,
  handleDODOSwapDSP
} from "../src/mappingDSP";

import {
  createBuySharesEvent,
  createSellSharesEvent,
  createDODOSwapDSPEvent
} from "./helpers/helpers_DSP.test";

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
    DSPPoolAddress
  );

  handleBuyShares(bsEvent);
  assert.fieldEquals(
    "LiquidityPool",
    DSPPoolAddress.toLowerCase(),
    "outputTokenSupply",
    "1000000000000000000"
  );
});

test("Can handle a SellShares Event", () => {
  let ssEvent = createSellSharesEvent(
    Account1Add,
    DSPPoolAddress,
    "1000000000000000000",
    "1000000000000000000",
    Token1Add,
    Token2Add,
    DSPPoolAddress
  );

  handleSellShares(ssEvent);

  assert.fieldEquals(
    "LiquidityPool",
    DSPPoolAddress.toLowerCase(),
    "outputTokenSupply",
    "0"
  );
});

test("Can handle a DODOSwap Event", () => {
  let swapEvent = createDODOSwapDSPEvent(
    Token1Add,
    Token2Add,
    "1000000000000000000",
    "1000000000000000000",
    Account1Add,
    Account2Add,
    DSPPoolAddress
  );

  handleDODOSwapDSP(swapEvent);
  let swapID = TxHash + "-" + "1";

  assert.fieldEquals("Swap", swapID, "from", DSPPoolAddress.toLowerCase());
});
