import {
  newMockEvent,
  test,
  assert,
  logStore,
  log,
  createMockedFunction
} from "matchstick-as/assembly/index";
import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { BuyShares, SellShares, DODOSwap } from "../generated/DVM/DVM";
import {
  handleBuyShares,
  handleSellShares,
  handleDODOSwap
} from "../src/mappingDVM";
import { ERC20 } from "../generated/CP/ERC20";
import { DVM } from "../generated/DVM/DVM";
import {
  createERC20Instance,
  createNewDVMEvent
} from "./helpers/factory_helpers.test";
import {
  createBuySharesEvent,
  createSellSharesEvent,
  createDODOSwapEvent
} from "./helpers/helpers_DVM.test";

test("Can handle a BuyShares Event", () => {
  let bsEvent = createBuySharesEvent(
    "0x6fdDB76c93299D985f4d3FC7ac468F9A168577A4",
    "1000000000000000000",
    "1000000000000000000"
  );

  handleBuyShares(bsEvent);
});

test("Can handle a SellShares Event", () => {
  let ssEvent = createSellSharesEvent(
    "0x72d220cE168C4f361dD4deE5D826a01AD8598f6C",
    "0x6fdDB76c93299D985f4d3FC7ac468F9A168577A4",
    1000000000000000000,
    1000000000000000000
  );
});

test("Can handle a DODOSwap Event", () => {
  let swapEvent = createDODOSwapEvent(
    "0x43dfc4159d86f3a37a5a4b3d4580b888ad7d4ddd",
    "0xc4436fbae6eba5d95bf7d53ae515f8a707bd402a",
    1000000000000000000,
    1000000000000000000,
    "0x72d220cE168C4f361dD4deE5D826a01AD8598f6C",
    "0x6fdDB76c93299D985f4d3FC7ac468F9A168577A4"
  );
});
