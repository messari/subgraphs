import { test, assert } from "matchstick-as/assembly/index";

import {
  handleBuyShares,
  handleSellShares,
  handleDODOSwapDSP
} from "../src/mappings/mappingDSP";

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
  DSPPoolAddress,
  DSPFactory_ADDRESS,
  TxHash
} from "./helpers/constants.test";

import { simulateActivity } from "./helpers/simulation_helper.test";

test("Can handle a BuyShares Event", () => {
  simulateActivity();

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
  simulateActivity();

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
  simulateActivity();

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
