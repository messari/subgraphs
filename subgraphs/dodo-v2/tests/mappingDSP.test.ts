import {
  newMockEvent,
  test,
  assert,
  logStore,
  log,
  createMockedFunction
} from "matchstick-as/assembly/index";
import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { BuyShares, SellShares, DODOSwap } from "../generated/DSP/DSP";
import {
  handleBuyShares,
  handleSellShares,
  handleDODOSwap
} from "../src/mappingDSP";
import { ERC20 } from "../generated/CP/ERC20";
import { DSP } from "../generated/DSP/DSP";
import {
  createERC20Instance,
  createNewDSPEvent
} from "./helpers/factory_helpers.test";
import {
  createBuySharesEvent,
  createSellSharesEvent,
  createDODOSwapEvent
} from "./helpers/helpers_DSP.test";

test("Can handle a BuyShares Event", () => {
  let bsEvent = createBuySharesEvent(
    "0x6fdDB76c93299D985f4d3FC7ac468F9A168577A4",
    "1000000000000000000",
    "1000000000000000000"
  );

  handleBuyShares(bsEvent);
  assert.fieldEquals(
    "LiquidityPool",
    "0x6fddb76c93299d985f4d3fc7ac468f9a168577a4",
    "outputTokenSupply",
    "1000000000000000000"
  );
});

test("Can handle a SellShares Event", () => {
  let ssEvent = createSellSharesEvent(
    "0x72d220cE168C4f361dD4deE5D826a01AD8598f6C",
    "0x6fdDB76c93299D985f4d3FC7ac468F9A168577A4",
    "1000000000000000000",
    "1000000000000000000"
  );

  handleSellShares(ssEvent);

  assert.fieldEquals(
    "LiquidityPool",
    "0x6fddb76c93299d985f4d3fc7ac468f9a168577a4",
    "outputTokenSupply",
    "0"
  );
});

test("Can handle a DODOSwap Event", () => {
  let swapEvent = createDODOSwapEvent(
    "0x43dfc4159d86f3a37a5a4b3d4580b888ad7d4ddd",
    "0xc4436fbae6eba5d95bf7d53ae515f8a707bd402a",
    "1000000000000000000",
    "1000000000000000000",
    "0x72d220cE168C4f361dD4deE5D826a01AD8598f6C",
    "0x6fdDB76c93299D985f4d3FC7ac468F9A168577A4"
  );

  handleDODOSwap(swapEvent);
  let swapID =
    "0xed3706c06c19a02844ba17d6d0e141063b9d33c54bdce5843b972cedd1ec4d90" +
    "-" +
    "1";

  assert.fieldEquals(
    "Swap",
    swapID,
    "from",
    "0x6fddb76c93299d985f4d3fc7ac468f9a168577a4"
  );
});
