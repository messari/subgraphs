import { getOrCreatePool } from "./utils/getters";

import {
  DVMFactory,
  NewDVM,
  RemoveDVM
} from "../generated/DVMFactory/DVMFactory";

import {
  CrowdPoolingFactory,
  NewCP
} from "../generated/CrowdPoolingFactory/CrowdPoolingFactory";

import {
  DPPFactory,
  NewDPP,
  RemoveDPP
} from "../generated/DPPFactory/DPPFactory";

import {
  DSPFactory,
  NewDSP,
  RemoveDSP
} from "../generated/DSPFactory/DSPFactory";

export function handleNewDVM(event: NewDVM): void {
  getOrCreatePool(
    event.params.dvm,
    event.params.baseToken,
    event.params.quoteToken,
    event.block.timestamp,
    event.block.number
  );
}

export function handleNewCP(event: NewCP): void {
  getOrCreatePool(
    event.params.cp,
    event.params.baseToken,
    event.params.quoteToken,
    event.block.timestamp,
    event.block.number
  );
}

export function handleNewDPP(event: NewDPP): void {
  getOrCreatePool(
    event.params.dpp,
    event.params.baseToken,
    event.params.quoteToken,
    event.block.timestamp,
    event.block.number
  );
}

export function handleNewDSP(event: NewDSP): void {
  getOrCreatePool(
    event.params.DSP,
    event.params.baseToken,
    event.params.quoteToken,
    event.block.timestamp,
    event.block.number
  );
}

export function handleRemoveDVM(event: RemoveDVM): void {
  // LiquidityPool.remove(event.params.dvm.toHex());
}

export function handleRemoveDPP(event: RemoveDPP): void {
  // LiquidityPool.remove(event.params.dvm.toHex());
}

export function handleRemoveDSP(event: RemoveDSP): void {
  // LiquidityPool.remove(event.params.dvm.toHex());
}
