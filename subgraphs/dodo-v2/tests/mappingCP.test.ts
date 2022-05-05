import {
  newMockEvent,
  test,
  assert,
  logStore,
  log,
  createMockedFunction
} from "matchstick-as/assembly/index";
import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { handleBid } from "../src/mappingCP";
import {
  createERC20Instance,
  createNewCPEvent
} from "./helpers/factory_helpers.test";
import { createBidEvent } from "./helpers/helpers_CP.test";

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

test("Can handle a Bid Event", () => {
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
