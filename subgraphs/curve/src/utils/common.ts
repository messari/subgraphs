import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { ERC20 } from "../../generated/Factory/ERC20";

import { LiquidityPool, Coin, DexAmmProtocol } from "../../generated/schema";

import {
  BIGDECIMAL_ZERO,
  DEFAULT_DECIMALS,
  FACTORY_ADDRESS,
  FEE_DECIMALS,
  Network,
  ProtocolType,
  toDecimal,
} from "./constant";
import { normalizedUsdcPrice, usdcPricePerToken } from "./pricing";

export function getOrCreateProtocol(): DexAmmProtocol {
  let id = Address.fromString(FACTORY_ADDRESS).toHexString();
  let protocol = DexAmmProtocol.load(id);
  if (!protocol) {
    protocol = new DexAmmProtocol(id);
    protocol.name = "curve finance";
    protocol.slug = "curve-finance";
    protocol.network = Network.ETHEREUM;
    protocol.type = ProtocolType.EXCHANGE;

    protocol.save();

    return protocol as DexAmmProtocol;
  }
  return protocol as DexAmmProtocol;
}

export function getOutTokenPriceUSD(pool: LiquidityPool): BigDecimal {
  return normalizedUsdcPrice(
    usdcPricePerToken(Address.fromBytes(pool._lpTokenAddress))
  );
}

export function getTVLUSD(pool: LiquidityPool): BigDecimal {
  let totalValueLockedUSD = BIGDECIMAL_ZERO;
  for (let i = 0; i < pool._coinCount.toI32(); ++i) {
    let coin = Coin.load(pool.id.concat("-").concat(i.toString()));
    if (coin !== null) {
      // @TODO: Get the USD Value of the coin.balance first
      totalValueLockedUSD.plus(coin.balance);
    }
  }
  return totalValueLockedUSD;
}

export function getCurrentTokenSupply(
  pool: LiquidityPool,
  token_supply: BigInt
): BigDecimal {
  // If token supply in event is 0, then check directly from contract
  let currentTokenSupply = toDecimal(token_supply, DEFAULT_DECIMALS);
  if (currentTokenSupply == toDecimal(BigInt.fromI32(0), DEFAULT_DECIMALS)) {
    let lpContract = ERC20.bind(Address.fromBytes(pool._lpTokenAddress));
    let supply = lpContract.try_totalSupply();
    if (!supply.reverted) {
      currentTokenSupply = toDecimal(supply.value, DEFAULT_DECIMALS);
    }
  }

  return currentTokenSupply;
}

export function addToPoolBalances(
  pool: LiquidityPool,
  token_amount: BigInt[],
  fees: BigInt[]
): BigDecimal[] {
  let newPoolBalances: BigDecimal[] = [];
  for (let i = 0; i < pool._coinCount.toI32(); ++i) {
    let coin = Coin.load(pool.id.concat("-").concat(i.toString()));
    if (coin !== null) {
      if (
        pool._coinCount.toI32() == token_amount.length &&
        pool._coinCount.toI32() == fees.length
      ) {
        coin.balance = coin.balance.plus(
          toDecimal(token_amount[i], DEFAULT_DECIMALS)
        );
        coin.feeBalance = coin.feeBalance.plus(
          toDecimal(fees[i], FEE_DECIMALS)
        );
        // @TODO: change this!!!!
        coin.feeBalanceUSD = coin.feeBalance
        coin.save();
        newPoolBalances.push(coin.balance);
      }
    }
  }
  pool.inputTokenBalances = newPoolBalances.map<BigDecimal>((pb) => pb);
  return pool.inputTokenBalances;
}

export function minusFromPoolBalances(
  pool: LiquidityPool,
  token_amount: BigInt[],
  fees: BigInt[]
): BigDecimal[] {
  let newPoolBalances: BigDecimal[] = [];
  for (let i = 0; i < pool._coinCount.toI32(); ++i) {
    let coin = Coin.load(pool.id.concat("-").concat(i.toString()));
    if (coin !== null) {
        coin.balance = coin.balance.minus(
          toDecimal(token_amount[i], DEFAULT_DECIMALS)
        );
        coin.feeBalance = coin.feeBalance.plus(
          toDecimal(fees[i], FEE_DECIMALS)
        );
        // @TODO: change this!!!!
        coin.feeBalanceUSD = coin.feeBalance
        coin.save();
        newPoolBalances.push(coin.balance);
    }
  }
  pool.inputTokenBalances = newPoolBalances.map<BigDecimal>((pb) => pb);
  return pool.inputTokenBalances;
}
