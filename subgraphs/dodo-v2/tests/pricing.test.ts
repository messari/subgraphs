import { test, assert } from "matchstick-as/assembly/index";

import { simulateActivity } from "./helpers/simulation_helper.test";

import { Token1Add, WRAPPED_ETH, DAI, USDC } from "./helpers/constants.test";

test("Accurately records the USD price of a token when it is traded for a stablecoin(Decimal Invariant)", () => {
  //run the simulations!!!!
  simulateActivity();
  //assert things
  assert.fieldEquals("Token", DAI.toLowerCase(), "lastPriceUSD", "1");
  assert.fieldEquals("Token", USDC.toLowerCase(), "lastPriceUSD", "1");
  assert.fieldEquals("Token", WRAPPED_ETH.toLowerCase(), "lastPriceUSD", "100");
});

test("Accurately records the USD price of a token when it is traded for a token that has a USD price(Decimal Invariant)", () => {
  //run the simulations!!!!
  simulateActivity();
  //assert things
  assert.fieldEquals("Token", WRAPPED_ETH.toLowerCase(), "lastPriceUSD", "100");
  assert.fieldEquals("Token", Token1Add.toLowerCase(), "lastPriceUSD", "1");
});
