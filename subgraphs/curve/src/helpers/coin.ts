import { Address, BigInt, Bytes } from "@graphprotocol/graph-ts";
import { Factory } from "../../generated/Factory/Factory";
import { Registry } from "../../generated/Factory/Registry";
import { StableSwap } from "../../generated/Factory/StableSwap";
import { Coin, LiquidityPool, UnderlyingCoin } from "../../generated/schema";
import {
  BIGDECIMAL_ZERO,
  DEFAULT_DECIMALS,
  getOrNull,
  toDecimal,
} from "../utils/constant";
import { getOrCreateToken } from "../utils/tokens";

export function saveCoin(
  pool: LiquidityPool,
  timestamp: BigInt,
  blockNumber: BigInt,
  transactionhash: Bytes
): void {
  let factoryContract = Factory.bind(Address.fromBytes(pool._factoryAddress));
  let registryContract = Registry.bind(Address.fromBytes(pool._swapAddress));

  let coins = getOrNull<Address[]>(
    factoryContract.try_get_coins(Address.fromBytes(pool._swapAddress))
  );
  let underlyingCoins = getOrNull<Address[]>(
    factoryContract.try_get_underlying_coins(Address.fromBytes(pool._swapAddress))
  );

  if (coins) {
    let balances = getOrNull<BigInt[]>(
      factoryContract.try_get_balances(Address.fromBytes(pool._swapAddress))
    );
    let rates = getOrNull<BigInt[]>(
      registryContract.try_get_rates(Address.fromBytes(pool._swapAddress))
    );

    for (let i = 0, count = pool._coinCount.toI32(); i < count; ++i) {
      let token = getOrCreateToken(coins[i]);
      let coin = Coin.load(pool.id.concat("-").concat(i.toString()));
      if (coin == null) {
        coin = new Coin(pool.id.concat("-").concat(i.toString()));
        coin.index = i;
        coin.pool = pool.id;
        coin.token = token.id;
        coin.underlying = coin.id;
        coin.balance = balances
          ? toDecimal(balances[i], token.decimals)
          : BIGDECIMAL_ZERO;
        coin.rate = rates
          ? toDecimal(rates[i], DEFAULT_DECIMALS)
          : BIGDECIMAL_ZERO;
        coin.balanceUSD = BIGDECIMAL_ZERO;
        coin.feeBalance = BIGDECIMAL_ZERO;
        coin.feeBalanceUSD = BIGDECIMAL_ZERO;
        coin.updated = timestamp;
        coin.updatedAtBlock = blockNumber;
        coin.updatedAtTransaction = transactionhash;
        coin.save();
      }
    }
  }

  if (underlyingCoins) {
    let getBalances = factoryContract.try_get_underlying_balances(
      Address.fromBytes(pool._swapAddress)
    );
    let balances: BigInt[] = getBalances.reverted ? [] : getBalances.value;

    for (let i = 0, count = pool._underlyingCount.toI32(); i < count; ++i) {
      let token = getOrCreateToken(underlyingCoins[i]);

      let coin = new UnderlyingCoin(pool.id + "-" + i.toString());
      coin.index = i;
      coin.pool = pool.id;
      coin.token = token.id;
      coin.coin = coin.id;
      coin.balance = balances
        ? toDecimal(balances[i], DEFAULT_DECIMALS)
        : BIGDECIMAL_ZERO;
      coin.updated = timestamp;
      coin.updatedAtBlock = blockNumber;
      coin.updatedAtTransaction = transactionhash;
      coin.save();
    }
  }
}
