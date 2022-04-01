import { Address } from "@graphprotocol/graph-ts";

import {
  DODOLpToken_ADDRESS,
  vDODOToken_ADDRESS,
  ZERO_BI,
  ZERO_BD
} from "./utils/constants";

import {
  getOrCreateToken,
  getOrCreateRewardToken,
  getOrCreateDexAmm,
  getOrCreateUsageMetricSnapshot,
  getOrCreateFinancials,
  getOrCreatePoolDailySnapshot
} from "./utils/getters";

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

import { LiquidityPool } from "../generated/schema";

export function handleNewDVM(event: NewDVM): void {
  let dodo = getOrCreateDexAmm(event.params.dvm);
  let pool = LiquidityPool.load(event.params.dvm.toHex());
  let it = getOrCreateToken(event.params.baseToken);
  let ot = getOrCreateToken(event.params.quoteToken);
  let dodoLp = getOrCreateRewardToken(Address.fromString(DODOLpToken_ADDRESS));
  let vdodo = getOrCreateRewardToken(Address.fromString(vDODOToken_ADDRESS));

  if (!pool) {
    pool = new LiquidityPool(event.params.dvm.toHex());
    pool.protocol = dodo.id;
    pool.inputTokens = [it.id];
    pool.outputToken = ot.id;
    pool.rewardTokens = [dodoLp.id, vdodo.id];
    pool.totalValueLockedUSD = ZERO_BD;
    pool.totalVolumeUSD = ZERO_BD;
    pool.inputTokenBalances = [ZERO_BI];
    pool.outputTokenSupply = ZERO_BI;
    pool.outputTokenPriceUSD = ZERO_BD;
    pool.rewardTokenEmissionsAmount = [ZERO_BI];
    pool.rewardTokenEmissionsUSD = [ZERO_BD];
    pool.createdTimestamp = event.block.timestamp;
    pool.createdBlockNumber = event.block.number;
  }
  pool.save();
}

export function handleNewCP(event: NewCP): void {
  let dodo = getOrCreateDexAmm(event.params.cp);
  let pool = LiquidityPool.load(event.params.cp.toHex());
  let it = getOrCreateToken(event.params.baseToken);
  let ot = getOrCreateToken(event.params.quoteToken);
  let dodoLp = getOrCreateRewardToken(Address.fromString(DODOLpToken_ADDRESS));
  let vdodo = getOrCreateRewardToken(Address.fromString(vDODOToken_ADDRESS));

  if (!pool) {
    pool = new LiquidityPool(event.params.cp.toHex());
    pool.protocol = dodo.id;
    pool.inputTokens = [it.id];
    pool.outputToken = ot.id;
    pool.rewardTokens = [dodoLp.id, vdodo.id];
    pool.totalValueLockedUSD = ZERO_BD;
    pool.totalVolumeUSD = ZERO_BD;
    pool.inputTokenBalances = [ZERO_BI];
    pool.outputTokenSupply = ZERO_BI;
    pool.outputTokenPriceUSD = ZERO_BD;
    pool.rewardTokenEmissionsAmount = [ZERO_BI];
    pool.rewardTokenEmissionsUSD = [ZERO_BD];
    pool.createdTimestamp = event.block.timestamp;
    pool.createdBlockNumber = event.block.number;
  }
  pool.save();
}

export function handleNewDPP(event: NewDPP): void {
  let dodo = getOrCreateDexAmm(event.params.dpp);
  let pool = LiquidityPool.load(event.params.dpp.toHex());
  let it = getOrCreateToken(event.params.baseToken);
  let ot = getOrCreateToken(event.params.quoteToken);
  let dodoLp = getOrCreateRewardToken(Address.fromString(DODOLpToken_ADDRESS));
  let vdodo = getOrCreateRewardToken(Address.fromString(vDODOToken_ADDRESS));

  if (!pool) {
    pool = new LiquidityPool(event.params.dpp.toHex());
    pool.protocol = dodo.id;
    pool.inputTokens = [it.id];
    pool.outputToken = ot.id;
    pool.rewardTokens = [dodoLp.id, vdodo.id];
    pool.totalValueLockedUSD = ZERO_BD;
    pool.totalVolumeUSD = ZERO_BD;
    pool.inputTokenBalances = [ZERO_BI];
    pool.outputTokenSupply = ZERO_BI;
    pool.outputTokenPriceUSD = ZERO_BD;
    pool.rewardTokenEmissionsAmount = [ZERO_BI];
    pool.rewardTokenEmissionsUSD = [ZERO_BD];
    pool.createdTimestamp = event.block.timestamp;
    pool.createdBlockNumber = event.block.number;
  }
  pool.save();
}

export function handleNewDSP(event: NewDSP): void {
  let dodo = getOrCreateDexAmm(event.params.DSP);
  let pool = LiquidityPool.load(event.params.DSP.toHex());
  let it = getOrCreateToken(event.params.baseToken);
  let ot = getOrCreateToken(event.params.quoteToken);
  let dodoLp = getOrCreateRewardToken(Address.fromString(DODOLpToken_ADDRESS));
  let vdodo = getOrCreateRewardToken(Address.fromString(vDODOToken_ADDRESS));

  if (!pool) {
    pool = new LiquidityPool(event.params.DSP.toHex());
    pool.protocol = dodo.id;
    pool.inputTokens = [it.id];
    pool.outputToken = ot.id;
    pool.rewardTokens = [dodoLp.id, vdodo.id];
    pool.totalValueLockedUSD = ZERO_BD;
    pool.totalVolumeUSD = ZERO_BD;
    pool.inputTokenBalances = [ZERO_BI];
    pool.outputTokenSupply = ZERO_BI;
    pool.outputTokenPriceUSD = ZERO_BD;
    pool.rewardTokenEmissionsAmount = [ZERO_BI];
    pool.rewardTokenEmissionsUSD = [ZERO_BD];
    pool.createdTimestamp = event.block.timestamp;
    pool.createdBlockNumber = event.block.number;
  }
  pool.save();
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
