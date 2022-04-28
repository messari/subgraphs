import {
  newMockEvent,
  test,
  assert,
  logStore,
  log,
  createMockedFunction
} from "matchstick-as/assembly/index";
import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { handleBid, handleCancel } from "../src/mappingCP";
import {
  createERC20Instance,
  createNewCPEvent
} from "./helpers/factory_helpers.test";
import { createBidEvent } from "./helpers/helpers_CP.test";

test("Can handle a Bid Event", () => {
  let newDVMevent = createNewCPEvent(
    "0x43dfc4159d86f3a37a5a4b3d4580b888ad7d4ddd",
    "0xc4436fbae6eba5d95bf7d53ae515f8a707bd402a",
    "0x72d220cE168C4f361dD4deE5D826a01AD8598f6C",
    "0x6fdDB76c93299D985f4d3FC7ac468F9A168577A4"
  );

  let bidEvent = createBidEvent(
    "0x6fdDB76c93299D985f4d3FC7ac468F9A168577A4",
    1000000000000000000,
    1000000000000000000
  );
});
