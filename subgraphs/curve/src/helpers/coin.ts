import { Address, BigInt, Bytes, log } from "@graphprotocol/graph-ts";
import { Factory } from "../../generated/Factory/Factory";
import { Registry } from "../../generated/Factory/Registry";
import { Coin, LiquidityPool, UnderlyingCoin } from "../../generated/schema";
import {
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
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
    log.info("Success: Coins {} found for pool {}", [coins.toString(), pool.id])
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
        log.info("Coin {} not found for pool {}", [coins[i].toHexString(), pool.id])
        coin = new Coin(pool.id.concat("-").concat(i.toString()));
        log.info("Coin {} created for pool {}", [coins[i].toHexString(), pool.id])
        coin.index = i;
        coin.pool = pool.id;
        coin.token = token.id;
        coin.underlying = coin.id;
        coin.balance = balances
          ? balances[i]
          : BIGINT_ZERO;
        coin.rate = rates
          ? toDecimal(rates[i], DEFAULT_DECIMALS)
          : BIGDECIMAL_ZERO;
        // coin.balanceUSD = BIGDECIMAL_ZERO;
        coin.feeBalance = BIGINT_ZERO;
        // coin.feeBalanceUSD = BIGDECIMAL_ZERO;
        coin.updated = timestamp;
        coin.updatedAtBlock = blockNumber;
        coin.updatedAtTransaction = transactionhash;
        coin.save();
      }
      log.info("Coin {} found for pool {}", [coins[i].toHexString(), pool.id])
    }
  }
  log.warning("Error: Coins for pool {} not found", [pool._swapAddress.toHexString()])

  if (underlyingCoins) {
    log.info("Success: Underlying Coins {} found for pool {}", [underlyingCoins.toString(), pool.id])
    let getBalances = factoryContract.try_get_underlying_balances(
      Address.fromBytes(pool._swapAddress)
    );
    let balances: BigInt[] = getBalances.reverted ? [] : getBalances.value;

    for (let i = 0, count = pool._underlyingCount.toI32(); i < count; ++i) {
      let token = getOrCreateToken(underlyingCoins[i]);
      let underlyingCoin = UnderlyingCoin.load(pool.id + "-" + i.toString())
      if(underlyingCoin == null) {
        let coin = new UnderlyingCoin(pool.id + "-" + i.toString());
        log.info("UnderlyingCoin {} created for pool {}", [coin.id, pool.id])
        coin.index = i;
        coin.pool = pool.id;
        coin.token = token.id;
        coin.coin = coin.id;
        coin.balance = balances
          ? balances[i]
          : BIGINT_ZERO;
        coin.updated = timestamp;
        coin.updatedAtBlock = blockNumber;
        coin.updatedAtTransaction = transactionhash;
        coin.save();

      }
    }
  }
  log.warning("Error: Underlyng Coins for pool {} not found", [pool._swapAddress.toHexString()])
}

