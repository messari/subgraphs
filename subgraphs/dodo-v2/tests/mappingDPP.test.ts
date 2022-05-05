import {
  newMockEvent,
  test,
  assert,
  logStore,
  log,
  createMockedFunction
} from "matchstick-as/assembly/index";
import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { DODOSwap } from "../generated/DPP/DPP";
import { handleDODOSwap } from "../src/mappingDPP";
import { ERC20 } from "../generated/CP/ERC20";
import { DPP } from "../generated/DPP/DPP";
import {
  createERC20Instance,
  createNewDPPEvent
} from "./helpers/factory_helpers.test";
import { createDODOSwapEvent } from "./helpers/helpers_DPP.test";
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

test("Can handle a DODOSwap Event", () => {
  let swapEvent = createDODOSwapEvent(
    Token1Add,
    Token2Add,
    "1000000000000000000",
    "1000000000000000000",
    Account1Add,
    Account2Add,
    DPPFactory_ADDRESS
  );

  handleDODOSwap(swapEvent);
  let swapID = TxHash + "-" + "1";

  assert.fieldEquals("Swap", swapID, "from", DPPFactory_ADDRESS.toLowerCase());
});
