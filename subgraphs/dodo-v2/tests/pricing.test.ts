import { test, assert } from "matchstick-as/assembly/index";

import { handleDODOSwap } from "../src/mappingDVM";

import {
  createBuySharesEvent,
  createSellSharesEvent,
  createDODOSwapEvent
} from "./helpers/helpers_DVM.test";

test("Accurately records the USD price of a token when it is traded for a stablecoin(18D)", () => {});
