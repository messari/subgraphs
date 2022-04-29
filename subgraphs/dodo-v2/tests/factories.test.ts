import { test, assert } from "matchstick-as/assembly/index";
import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";

import {
  handleNewDVM,
  handleNewCP,
  handleNewDPP,
  handleNewDSP
} from "../src/mappingFactory";

import {
  createERC20Instance,
  createNewDVMEvent,
  createNewDSPEvent,
  createNewDPPEvent,
  createNewCPEvent
} from "./helpers/factory_helpers.test";

test("Creates an ERC20 Token instance", () => {
  let name = ethereum.Value.fromString("Input Base Token Name");
  let symbol = ethereum.Value.fromString("IBTN");
  let decimals = ethereum.Value.fromI32(18);

  let token = createERC20Instance(
    "0x43dfc4159d86f3a37a5a4b3d4580b888ad7d4ddd",
    "Input Base Token Name",
    "IBTN",
    18
  );
  let result1 = token.try_name();
  let result2 = token.try_symbol();
  let result3 = token.try_decimals();

  assert.equals(name, ethereum.Value.fromString(result1.value));
  assert.equals(symbol, ethereum.Value.fromString(result2.value));
  assert.equals(decimals, ethereum.Value.fromI32(result3.value));
});

//Event creation helpers///////

test("Can handle new DVM", () => {
  let newDVMevent = createNewDVMEvent(
    "0x43dfc4159d86f3a37a5a4b3d4580b888ad7d4ddd",
    "0xc4436fbae6eba5d95bf7d53ae515f8a707bd402a",
    "0x72d220cE168C4f361dD4deE5D826a01AD8598f6C",
    "0x6fdDB76c93299D985f4d3FC7ac468F9A168577A4"
  );

  handleNewDVM(newDVMevent);

  assert.fieldEquals(
    "DexAmmProtocol",
    "0x72d220cE168C4f361dD4deE5D826a01AD8598f6C",
    "slug",
    "messari-dodo"
  );

  assert.fieldEquals(
    "LiquidityPool",
    "0x6fddb76c93299d985f4d3fc7ac468f9a168577a4",
    "inputTokens",
    "[0x43dfc4159d86f3a37a5a4b3d4580b888ad7d4ddd, 0xc4436fbae6eba5d95bf7d53ae515f8a707bd402a]"
  );
});

test("Can handle new DSP", () => {
  let tokenb = createERC20Instance(
    "0x43dfc4159d86f3a37a5a4b3d4580b888ad7d4ddd",
    "Input Base Token Name",
    "IBTN",
    18
  );

  let tokenq = createERC20Instance(
    "0xc4436fbae6eba5d95bf7d53ae515f8a707bd402a",
    "Input Quote Token Name",
    "IQTN",
    18
  );

  let lpToken = createERC20Instance(
    "0x6fdDB76c93299D985f4d3FC7ac468F9A168577A4",
    "LP Token",
    "LPT",
    18
  );

  let newDVMevent = createNewDSPEvent(
    "0x43dfc4159d86f3a37a5a4b3d4580b888ad7d4ddd",
    "0xc4436fbae6eba5d95bf7d53ae515f8a707bd402a",
    "0x72d220cE168C4f361dD4deE5D826a01AD8598f6C",
    "0x6fdDB76c93299D985f4d3FC7ac468F9A168577A4"
  );

  handleNewDSP(newDVMevent);

  assert.fieldEquals(
    "DexAmmProtocol",
    "0x72d220cE168C4f361dD4deE5D826a01AD8598f6C",
    "slug",
    "messari-dodo"
  );

  assert.fieldEquals(
    "LiquidityPool",
    "0x6fddb76c93299d985f4d3fc7ac468f9a168577a4",
    "inputTokens",
    "[0x43dfc4159d86f3a37a5a4b3d4580b888ad7d4ddd, 0xc4436fbae6eba5d95bf7d53ae515f8a707bd402a]"
  );
});

test("Can handle new DPP", () => {
  let tokenb = createERC20Instance(
    "0x43dfc4159d86f3a37a5a4b3d4580b888ad7d4ddd",
    "Input Base Token Name",
    "IBTN",
    18
  );

  let tokenq = createERC20Instance(
    "0xc4436fbae6eba5d95bf7d53ae515f8a707bd402a",
    "Input Quote Token Name",
    "IQTN",
    18
  );

  let lpToken = createERC20Instance(
    "0x6fdDB76c93299D985f4d3FC7ac468F9A168577A4",
    "LP Token",
    "LPT",
    18
  );

  let newDVMevent = createNewDPPEvent(
    "0x43dfc4159d86f3a37a5a4b3d4580b888ad7d4ddd",
    "0xc4436fbae6eba5d95bf7d53ae515f8a707bd402a",
    "0x72d220cE168C4f361dD4deE5D826a01AD8598f6C",
    "0x6fdDB76c93299D985f4d3FC7ac468F9A168577A4"
  );

  handleNewDPP(newDVMevent);

  assert.fieldEquals(
    "DexAmmProtocol",
    "0x72d220cE168C4f361dD4deE5D826a01AD8598f6C",
    "slug",
    "messari-dodo"
  );

  assert.fieldEquals(
    "LiquidityPool",
    "0x6fddb76c93299d985f4d3fc7ac468f9a168577a4",
    "inputTokens",
    "[0x43dfc4159d86f3a37a5a4b3d4580b888ad7d4ddd, 0xc4436fbae6eba5d95bf7d53ae515f8a707bd402a]"
  );
});

test("Can handle new CrowdPool", () => {
  let tokenb = createERC20Instance(
    "0x43dfc4159d86f3a37a5a4b3d4580b888ad7d4ddd",
    "Input Base Token Name",
    "IBTN",
    18
  );

  let tokenq = createERC20Instance(
    "0xc4436fbae6eba5d95bf7d53ae515f8a707bd402a",
    "Input Quote Token Name",
    "IQTN",
    18
  );

  let lpToken = createERC20Instance(
    "0x6fdDB76c93299D985f4d3FC7ac468F9A168577A4",
    "LP Token",
    "LPT",
    18
  );

  let newDVMevent = createNewCPEvent(
    "0x43dfc4159d86f3a37a5a4b3d4580b888ad7d4ddd",
    "0xc4436fbae6eba5d95bf7d53ae515f8a707bd402a",
    "0x72d220cE168C4f361dD4deE5D826a01AD8598f6C",
    "0x6fdDB76c93299D985f4d3FC7ac468F9A168577A4"
  );

  handleNewCP(newDVMevent);

  assert.fieldEquals(
    "DexAmmProtocol",
    "0x72d220cE168C4f361dD4deE5D826a01AD8598f6C",
    "slug",
    "messari-dodo"
  );

  assert.fieldEquals(
    "LiquidityPool",
    "0x6fddb76c93299d985f4d3fc7ac468f9a168577a4",
    "inputTokens",
    "[0x43dfc4159d86f3a37a5a4b3d4580b888ad7d4ddd, 0xc4436fbae6eba5d95bf7d53ae515f8a707bd402a]"
  );
});
