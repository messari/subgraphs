import { test, assert } from "matchstick-as/assembly/index";
import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { handleBid } from "../src/mappings/mappingCP";
import { createBidEvent } from "./helpers/helpers_CP.test";

import {
  Account1Add,
  Account2Add,
  Token1Add,
  Token2Add,
  CPPoolAddress,
  CPFactory_ADDRESS,
  TxHash
} from "./helpers/constants.test";

import { simulateActivity } from "./helpers/simulation_helper.test";

test("Can handle a Bid Event", () => {
  simulateActivity();

  let bidEvent = createBidEvent(
    Account1Add, //to
    "1000000000000000000",
    "1000000000000000000",
    Token1Add, //btoken
    Token2Add, //qtoken
    CPPoolAddress //cpAdd
  );

  handleBid(bidEvent);
  assert.fieldEquals(
    "LiquidityPool",
    CPPoolAddress.toLowerCase(),
    "outputTokenSupply",
    "1000000000000000000"
  );
});
