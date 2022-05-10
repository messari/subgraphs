import { Address, BigInt } from "@graphprotocol/graph-ts";
import { StableSwap } from "../../generated/Factory/StableSwap";
import { DexAmmProtocol, LiquidityPool, LiquidityPoolFee } from "../../generated/schema";
import {
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  factoryContract,
  FACTORY_ADDRESS,
  FEE_DECIMALS,
  LiquidityPoolFeeType,
  Network,
  ProtocolType,
  STAKERS_FEE_SHARE,
  SUPPLY_FEE_SHARE,
  toDecimal,
  ZERO_ADDRESS,
} from "./constant";

export function getOrCreateProtocol(): DexAmmProtocol {
  let id = Address.fromString(FACTORY_ADDRESS).toHexString();
  let protocol = DexAmmProtocol.load(id);
  if (!protocol) {
    protocol = new DexAmmProtocol(id);
    protocol.name = "ellipsis finance";
    protocol.slug = "ellipsis-finance";
    protocol.network = Network.BSC;
    protocol.schemaVersion = "1.0.0";
    protocol.subgraphVersion = "1.0.0";
    protocol.type = ProtocolType.EXCHANGE;
    protocol.totalUniqueUsers = 0;
    protocol.totalValueLockedUSD = BIGDECIMAL_ZERO;
    protocol.save();

    return protocol as DexAmmProtocol;
  }
  return protocol as DexAmmProtocol;
}

export function getCoins(poolAddress: Address): Address[] {
  let poolContract = StableSwap.bind(poolAddress);
  let coinCount = 2;
  let coins: Address[] = [];
  for (let i = 0; i < coinCount; i++) {
    let getCoins = poolContract.try_coins(BigInt.fromI32(i));
    if (!getCoins.reverted) {
      coins.push(getCoins.value);
    }
  }
  return coins;
}

export function getLpToken(poolAddress: Address): Address {
  let poolContract = StableSwap.bind(poolAddress);
  let getLpToken = poolContract.try_lp_token();
  if (!getLpToken.reverted) {
    let lpToken = getLpToken.value;
    return lpToken;
  }
  return Address.fromString(ZERO_ADDRESS);
}

export function getPoolBalances(poolAddress: Address): BigInt[] {
  let poolContract = StableSwap.bind(poolAddress);
  let pool = LiquidityPool.load(poolAddress.toHexString());
  if (pool !== null) {
    let poolBalances: BigInt[] = [];
    for (let i = 0; i < pool.inputTokens.length; i++) {
      let getPoolBalances = poolContract.try_balances(BigInt.fromI32(i));
      if (!getPoolBalances.reverted) {
        poolBalances.push(getPoolBalances.value);
      } else {
        poolBalances.push(BIGINT_ZERO);
      }
    }
    return poolBalances;
  }
  return [];
}

export function getOrCreateTradingFees(poolAddress: Address): LiquidityPoolFee {
  let id = poolAddress.toHexString().concat("- tradingFee");
  let tradingFee = LiquidityPoolFee.load(id);
  if (tradingFee == null) {
    tradingFee = new LiquidityPoolFee(id);
    tradingFee.feeType = LiquidityPoolFeeType.DYNAMIC_TRADING_FEE;
    let getFee = factoryContract.try_get_fees(poolAddress);
    if (!getFee.reverted) {
      tradingFee.feePercentage = toDecimal(getFee.value.value0, FEE_DECIMALS);
    }
    tradingFee.save();

    return tradingFee as LiquidityPoolFee;
  }
  return tradingFee as LiquidityPoolFee;
}

export function getOrCreateStakersFeeShare(poolAddress: Address): LiquidityPoolFee {
  let id = poolAddress.toHexString().concat("- stakersFee");
  let stakersFee = LiquidityPoolFee.load(id);
  if (stakersFee == null) {
    stakersFee = new LiquidityPoolFee(id);
    stakersFee.feeType = LiquidityPoolFeeType.FIXED_PROTOCOL_FEE;
    stakersFee.feePercentage = getOrCreateTradingFees(poolAddress).feePercentage.times(STAKERS_FEE_SHARE);
    stakersFee.save();

    return stakersFee as LiquidityPoolFee;
  }
  return stakersFee as LiquidityPoolFee;
}

export function getOrCreateSupplyFeeShare(poolAddress: Address): LiquidityPoolFee {
  let id = poolAddress.toHexString().concat("- supplyFee");
  let supplyFee = LiquidityPoolFee.load(id);
  if (supplyFee == null) {
    supplyFee = new LiquidityPoolFee(id);
    supplyFee.feeType = LiquidityPoolFeeType.FIXED_PROTOCOL_FEE;
    supplyFee.feePercentage = getOrCreateTradingFees(poolAddress).feePercentage.times(SUPPLY_FEE_SHARE);
    supplyFee.save();

    return supplyFee as LiquidityPoolFee;
  }
  return supplyFee as LiquidityPoolFee;
}
