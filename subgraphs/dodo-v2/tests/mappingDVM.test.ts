import { test, assert } from "matchstick-as/assembly/index";

import {
  handleBuyShares,
  handleSellShares,
  handleDODOSwapDVM
} from "../src/mappings/mappingDVM";

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
  DVMPoolAddress,
  DVMFactory_ADDRESS,
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
  simulateActivity();

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
  simulateActivity();

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
