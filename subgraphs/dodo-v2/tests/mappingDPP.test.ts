import { test, assert } from "matchstick-as/assembly/index";
import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { DODOSwap } from "../generated/DPP/DPP";
import { handleDODOSwap } from "../src/mappings/mappingDPP";
import { createDODOSwapEvent } from "./helpers/helpers_DPP.test";
import {
  Account1Add,
  Account2Add,
  Token1Add,
  Token2Add,
  DPPPoolAddress,
  DPPFactory_ADDRESS,
  TxHash
} from "./helpers/constants.test";

import { simulateActivity } from "./helpers/simulation_helper.test";

test("Can handle a DODOSwap Event", () => {
  simulateActivity();

  let swapEvent = createDODOSwapEvent(
    Token1Add,
    Token2Add,
    "1000000000000000000",
    "1000000000000000000",
    Account1Add,
    Account2Add,
    DPPPoolAddress
  );

  handleDODOSwap(swapEvent);
  let swapID = TxHash + "-" + "1";

  assert.fieldEquals("Swap", swapID, "from", DPPPoolAddress.toLowerCase());
});
