import { test, assert } from "matchstick-as/assembly/index";
import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";

import {
  createERC20Instance,
  simulateActivity
} from "./helpers/simulation_helper.test";

import {
  Account1Add,
  Account2Add,
  Token1Add,
  Token2Add,
  Token3Add,
  Token4Add,
  DODOLpToken_ADDRESS,
  vDODOToken_ADDRESS,
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

test("Creates an ERC20 Token instance", () => {
  simulateActivity();
  let name = ethereum.Value.fromString("Test Token Name");
  let symbol = ethereum.Value.fromString("TTN");
  let decimals = ethereum.Value.fromI32(18);

  let token = createERC20Instance(Token3Add, "Test Token Name", "TTN", 18);
  let result1 = token.try_name();
  let result2 = token.try_symbol();
  let result3 = token.try_decimals();

  assert.equals(name, ethereum.Value.fromString(result1.value));
  assert.equals(symbol, ethereum.Value.fromString(result2.value));
  assert.equals(decimals, ethereum.Value.fromI32(result3.value));
});

test("Can handle new DVM", () => {
  simulateActivity();

  assert.fieldEquals(
    "DexAmmProtocol",
    DVMFactory_ADDRESS, //purposefully set as factory address for tests
    "slug",
    "messari-dodo"
  );

  let lower1 = Token1Add.toLowerCase();
  let lower2 = Token2Add.toLowerCase();

  let ary = "[" + lower1 + ", " + lower2 + "]";

  assert.fieldEquals(
    "LiquidityPool",
    DVMPoolAddress.toLowerCase(),
    "inputTokens",
    ary
  );
});

test("Can handle new DSP", () => {
  simulateActivity();

  assert.fieldEquals(
    "DexAmmProtocol",
    DSPFactory_ADDRESS,
    "slug",
    "messari-dodo"
  );

  let lower1 = Token1Add.toLowerCase();
  let lower2 = Token2Add.toLowerCase();

  let ary = "[" + lower1 + ", " + lower2 + "]";

  assert.fieldEquals(
    "LiquidityPool",
    DSPPoolAddress.toLowerCase(),
    "inputTokens",
    ary
  );
});

test("Can handle new DPP", () => {
  simulateActivity();

  assert.fieldEquals(
    "DexAmmProtocol",
    DPPFactory_ADDRESS,
    "slug",
    "messari-dodo"
  );

  let lower1 = Token1Add.toLowerCase();
  let lower2 = Token2Add.toLowerCase();

  let ary = "[" + lower1 + ", " + lower2 + "]";

  assert.fieldEquals(
    "LiquidityPool",
    DPPPoolAddress.toLowerCase(),
    "inputTokens",
    ary
  );
});

test("Can handle new CrowdPool", () => {
  simulateActivity();

  assert.fieldEquals(
    "DexAmmProtocol",
    CPFactory_ADDRESS,
    "slug",
    "messari-dodo"
  );

  let lower1 = Token1Add.toLowerCase();
  let lower2 = Token2Add.toLowerCase();

  let ary = "[" + lower1 + ", " + lower2 + "]";

  assert.fieldEquals(
    "LiquidityPool",
    CPPoolAddress.toLowerCase(),
    "inputTokens",
    ary
  );
});
