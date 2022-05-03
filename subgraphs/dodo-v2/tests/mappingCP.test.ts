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

test("Can handle a Bid Event", () => {
  let bidEvent = createBidEvent(
    "0x6fdDB76c93299D985f4d3FC7ac468F9A168577A4",
    "1000000000000000000",
    "1000000000000000000"
  );

  handleBid(bidEvent);
  assert.fieldEquals(
    "LiquidityPool",
    "0x6fddb76c93299d985f4d3fc7ac468f9a168577a4",
    "outputTokenSupply",
    "1000000000000000000"
  );
});
