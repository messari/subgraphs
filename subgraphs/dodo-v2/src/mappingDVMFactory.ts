import { BigInt, BigDecimal, Address } from "@graphprotocol/graph-ts";
import {
  DODOLpToken_ADDRESS,
  vDODOToken_ADDRESS,
  ZERO_BI,
  ONE_BI,
  ZERO_BD,
  ADDRESS_ZERO,
  Network,
  ProtocolType,
  RewardTokenType
} from "./utils/constants";

import { getOrCreateToken, getOrCreateRewardToken } from "./utils/getters";

import {
  DVMFactory,
  NewDVM,
  OwnershipTransferPrepared,
  OwnershipTransferred,
  RemoveDVM
} from "../generated/DVMFactory/DVMFactory";

import { ERC20 } from "../generated/ERC20/ERC20";

import {
  DexAmmProtocol,
  LiquidityPool,
  Token,
  RewardToken
} from "../generated/schema";

export function handleNewDVM(event: NewDVM): void {
  let dodo = DexAmmProtocol.load(event.address.toHex());
  let pool = LiquidityPool.load(event.params.dvm.toHex());
  let it = getOrCreateToken(event.params.baseToken);
  let ot = getOrCreateToken(event.params.quoteToken);
  let dodoLp = getOrCreateRewardToken(Address.fromString(DODOLpToken_ADDRESS));
  let vdodo = getOrCreateRewardToken(Address.fromString(vDODOToken_ADDRESS));

  if (!dodo) {
    dodo = new DexAmmProtocol(event.address.toHex());
    dodo.name = "DODO V2";
    dodo.slug = "messari-dodo";
    dodo.schemaVersion = "schema-dex-amm";
    dodo.subgraphVersion = "0.0.2";
    dodo.network = "ETHEREUM";
    dodo.type = "EXCHANGE";
    dodo.totalUniqueUsers = 0;
    dodo.totalValueLockedUSD = ZERO_BD;
  }

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

  dodo.save();
  pool.save();
}

export function handleRemoveDVM(event: RemoveDVM): void {
  // LiquidityPool.remove(event.params.dvm.toHex());
}
