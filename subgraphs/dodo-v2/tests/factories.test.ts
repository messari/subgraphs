import {
  newMockEvent,
  test,
  assert,
  logStore,
  log,
  createMockedFunction
} from "matchstick-as/assembly/index";
import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { NewDVM } from "../generated/DVMFactory/DVMFactory";
import { NewDSP } from "../generated/DSPFactory/DSPFactory";
import { NewDPP } from "../generated/DPPFactory/DPPFactory";
import { NewCP } from "../generated/CrowdPoolingFactory/CrowdPoolingFactory";
import {
  handleNewDVM,
  handleNewCP,
  handleNewDPP,
  handleNewDSP
} from "../src/mappingFactory";
import { ERC20 } from "../generated/CP/ERC20";
import { DVM } from "../generated/DVM/DVM";

import {
  DVMFactory_ADDRESS,
  CPFactory_ADDRESS,
  DPPFactory_ADDRESS,
  DSPFactory_ADDRESS
} from "../src/utils/constants";

export function createERC20Instance(
  tokenAdd: string,
  namei: string,
  symboli: string,
  decimalsi: i32
): ERC20 {
  let erc20Base = Address.fromString(tokenAdd);
  let name = ethereum.Value.fromString(namei);
  let symbol = ethereum.Value.fromString(symboli);
  let decimals = ethereum.Value.fromI32(decimalsi);

  createMockedFunction(erc20Base, "name", "name():(string)").returns([name]);
  createMockedFunction(erc20Base, "symbol", "symbol():(string)").returns([
    symbol
  ]);
  createMockedFunction(erc20Base, "decimals", "decimals():(uint8)").returns([
    decimals
  ]);

  let erc20 = ERC20.bind(erc20Base);
  return erc20;
}

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
export function createNewDVMEvent(
  baseToken: string,
  quoteToken: string,
  creator: string,
  dvm: string
): NewDVM {
  let dVm = Address.fromString(dvm);
  let version = ethereum.Value.fromString("DVM 1.0.2");

  createMockedFunction(dVm, "version", "version():(string)").returns([version]);

  let newDVMevent = changetype<NewDVM>(newMockEvent());
  newDVMevent.parameters = new Array();

  let baseTokenParam = new ethereum.EventParam(
    "baseToken",
    ethereum.Value.fromAddress(Address.fromString(baseToken))
  );

  let quoteTokenParam = new ethereum.EventParam(
    "quoteToken",
    ethereum.Value.fromAddress(Address.fromString(quoteToken))
  );

  let creatorParam = new ethereum.EventParam(
    "creator",
    ethereum.Value.fromAddress(Address.fromString(creator))
  );

  let dvmParam = new ethereum.EventParam(
    "dvm",
    ethereum.Value.fromAddress(Address.fromString(dvm))
  );

  newDVMevent.parameters.push(baseTokenParam);
  newDVMevent.parameters.push(quoteTokenParam);
  newDVMevent.parameters.push(creatorParam);
  newDVMevent.parameters.push(dvmParam);

  return newDVMevent;
}

test("Can handle new DVM", () => {
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

export function createNewDSPEvent(
  baseToken: string,
  quoteToken: string,
  creator: string,
  dsp: string
): NewDSP {
  let dVm = Address.fromString(dsp);
  let version = ethereum.Value.fromString("DSP 1.0.1");

  createMockedFunction(dVm, "version", "version():(string)").returns([version]);

  let newDSPevent = changetype<NewDSP>(newMockEvent());
  newDSPevent.parameters = new Array();

  let baseTokenParam = new ethereum.EventParam(
    "baseToken",
    ethereum.Value.fromAddress(Address.fromString(baseToken))
  );

  let quoteTokenParam = new ethereum.EventParam(
    "quoteToken",
    ethereum.Value.fromAddress(Address.fromString(quoteToken))
  );

  let creatorParam = new ethereum.EventParam(
    "creator",
    ethereum.Value.fromAddress(Address.fromString(creator))
  );

  let dspParam = new ethereum.EventParam(
    "dsp",
    ethereum.Value.fromAddress(Address.fromString(dsp))
  );

  newDSPevent.parameters.push(baseTokenParam);
  newDSPevent.parameters.push(quoteTokenParam);
  newDSPevent.parameters.push(creatorParam);
  newDSPevent.parameters.push(dspParam);

  return newDSPevent;
}

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
//
export function createNewDPPEvent(
  baseToken: string,
  quoteToken: string,
  creator: string,
  dpp: string
): NewDPP {
  let dVm = Address.fromString(dpp);
  let version = ethereum.Value.fromString("DPP 1.0.0");

  createMockedFunction(dVm, "version", "version():(string)").returns([version]);

  let newDPPevent = changetype<NewDPP>(newMockEvent());
  newDPPevent.parameters = new Array();

  let baseTokenParam = new ethereum.EventParam(
    "baseToken",
    ethereum.Value.fromAddress(Address.fromString(baseToken))
  );

  let quoteTokenParam = new ethereum.EventParam(
    "quoteToken",
    ethereum.Value.fromAddress(Address.fromString(quoteToken))
  );

  let creatorParam = new ethereum.EventParam(
    "creator",
    ethereum.Value.fromAddress(Address.fromString(creator))
  );

  let dppParam = new ethereum.EventParam(
    "dpp",
    ethereum.Value.fromAddress(Address.fromString(dpp))
  );

  newDPPevent.parameters.push(baseTokenParam);
  newDPPevent.parameters.push(quoteTokenParam);
  newDPPevent.parameters.push(creatorParam);
  newDPPevent.parameters.push(dppParam);

  return newDPPevent;
}

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

export function createNewCPEvent(
  baseToken: string,
  quoteToken: string,
  creator: string,
  cp: string
): NewCP {
  let dVm = Address.fromString(cp);
  let version = ethereum.Value.fromString("CP 1.0.0");

  createMockedFunction(dVm, "version", "version():(string)").returns([version]);

  let newCPevent = changetype<NewCP>(newMockEvent());
  newCPevent.parameters = new Array();

  let baseTokenParam = new ethereum.EventParam(
    "baseToken",
    ethereum.Value.fromAddress(Address.fromString(baseToken))
  );

  let quoteTokenParam = new ethereum.EventParam(
    "quoteToken",
    ethereum.Value.fromAddress(Address.fromString(quoteToken))
  );

  let creatorParam = new ethereum.EventParam(
    "creator",
    ethereum.Value.fromAddress(Address.fromString(creator))
  );

  let cpParam = new ethereum.EventParam(
    "cp",
    ethereum.Value.fromAddress(Address.fromString(cp))
  );

  newCPevent.parameters.push(baseTokenParam);
  newCPevent.parameters.push(quoteTokenParam);
  newCPevent.parameters.push(creatorParam);
  newCPevent.parameters.push(cpParam);

  return newCPevent;
}

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
