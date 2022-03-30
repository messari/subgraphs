import { Address, BigInt, Bytes, log } from "@graphprotocol/graph-ts";
import { Factory } from "../../generated/Factory/Factory";
import { Registry } from "../../generated/Factory/Registry";
import { Coin, LiquidityPool, UnderlyingCoin } from "../../generated/schema";
import { getOrCreateProtocol } from "../utils/common";
import {
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  DEFAULT_DECIMALS,
  getOrNull,
  REGISTRY_ADDRESS,
  toDecimal,
} from "../utils/constant";
import { getOrCreateToken } from "../utils/tokens";

export function saveCoin(
  pool: LiquidityPool,
  coins: Address[],
  underlyingCoins: Address[],
  balances: BigInt[],
  timestamp: BigInt,
  blockNumber: BigInt,
  transactionhash: Bytes
): void {
  let protocol = getOrCreateProtocol();
  let factoryContract = Factory.bind(Address.fromString(protocol.id))
  let registryContract = Registry.bind(Address.fromString(REGISTRY_ADDRESS));

  if (coins) {
    log.info("Success: Coins {} found for pool {}", [coins.toString(), pool.id])
    
    let rates = getOrNull<BigInt[]>(
      registryContract.try_get_rates(Address.fromString(pool.id))
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
        coin.balance = balances[i]
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
  log.warning("Error: Coins for pool {} not found", [pool.id])

  if (underlyingCoins) {
    log.info("Success: Underlying Coins {} found for pool {}", [underlyingCoins.toString(), pool.id])
    let getBalances = factoryContract.try_get_underlying_balances(
      Address.fromString(pool.id)
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
  log.warning("Error: Underlying Coins for pool {} not found", [pool.id])
}

