import { SDK } from "../../../../src/sdk/protocols/bridge";
import { TokenPricer } from "../../../../src/sdk/protocols/config";
import {
  TokenInitializer,
  TokenParams,
} from "../../../../src/sdk/protocols/bridge/tokens";

import { NetworkConfigs } from "../../../../configurations/configure";
import { Address, BigDecimal, BigInt, log } from "@graphprotocol/graph-ts";
import {
  RewardPaid,
  Staked,
  Withdrawn,
} from "../../../../generated/HopL2Rewards/L2_Reward";
import { Token } from "../../../../generated/schema";
import { getUsdPricePerToken, getUsdPrice } from "../../../../src/prices/index";
import { bigIntToBigDecimal } from "../../../../src/sdk/util/numbers";

import {
  updateRewardsPaid,
  updateStaked,
  updateWithdrawn,
} from "../../../../src/sdk/util/rewards";
import { conf } from "../../../../src/sdk/util/bridge";
import { FOUR, THREE } from "../../../../src/sdk/util/constants";

class Pricer implements TokenPricer {
  getTokenPrice(token: Token): BigDecimal {
    const price = getUsdPricePerToken(Address.fromBytes(token.id));
    return price.usdPrice;
  }

  getAmountValueUSD(token: Token, amount: BigInt): BigDecimal {
    const _amount = bigIntToBigDecimal(amount, token.decimals);
    return getUsdPrice(Address.fromBytes(token.id), _amount);
  }
}

class TokenInit implements TokenInitializer {
  getTokenParams(address: Address): TokenParams {
    const tokenConfig = NetworkConfigs.getTokenDetails(address.toHex());

    if (tokenConfig.length != FOUR) {
      log.error("Invalid tokenConfig length", []);
    }

    const name = tokenConfig[1];
    const symbol = tokenConfig[0];
    const decimals = BigInt.fromString(tokenConfig[2]).toI32();
    return { name, symbol, decimals };
  }
}

export function handleRewardsPaid(event: RewardPaid): void {
  if (
    !NetworkConfigs.getRewardTokenList().includes(event.address.toHexString())
  ) {
    log.error("Missing Config", []);
    return;
  }
  const poolAddress = NetworkConfigs.getPoolAddressFromRewardTokenAddress(
    event.address.toHexString()
  );

  const poolConfig = NetworkConfigs.getPoolDetails(poolAddress);
  log.info("GNO RewardsPaid 1 --> poolAddress: {},", [poolAddress]);

  if (poolConfig.length != THREE) {
    log.error("Invalid PoolConfig length", []);
    return;
  }
  const poolSymbol = poolConfig[0];
  const poolName = poolConfig[1];
  const hPoolName = poolConfig[2];

  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );
  updateRewardsPaid(
    sdk.Pools,
    sdk.Pools,
    sdk.Tokens,
    poolName,
    poolSymbol,
    hPoolName,
    poolAddress,
    event
  );
}

export function handleStaked(event: Staked): void {
  if (
    !NetworkConfigs.getRewardTokenList().includes(event.address.toHexString())
  ) {
    log.error("Missing Config", []);
    return;
  }
  const amount = event.params.amount;

  const poolAddress = NetworkConfigs.getPoolAddressFromRewardTokenAddress(
    event.address.toHexString()
  );
  log.info("Staked --> emitter: {}, poolAddress: {}, amount: {}", [
    event.address.toHexString(),
    poolAddress,
    amount.toString(),
  ]);

  const poolConfig = NetworkConfigs.getPoolDetails(poolAddress);
  if (poolConfig.length != THREE) {
    log.error("Invalid PoolConfig length", []);
    return;
  }
  log.info("Staked 1 --> poolAddress: {},", [poolAddress]);

  const poolSymbol = poolConfig[0];
  const poolName = poolConfig[1];
  const hPoolName = poolConfig[2];

  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );
  updateStaked(
    sdk.Pools,
    sdk.Pools,
    sdk.Tokens,
    poolName,
    poolSymbol,
    hPoolName,
    poolAddress,
    event.address.toHexString(),
    amount
  );

  sdk.Accounts.loadAccount(event.params.user);
}

export function handleWithdrawn(event: Withdrawn): void {
  if (
    !NetworkConfigs.getRewardTokenList().includes(event.address.toHexString())
  ) {
    log.error("Missing Config", []);
    return;
  }
  const amount = event.params.amount;

  const poolAddress = NetworkConfigs.getPoolAddressFromRewardTokenAddress(
    event.address.toHexString()
  );
  log.info("UnStaked --> emitter: {}, poolAddress: {}, amount: {}", [
    event.address.toHexString(),
    poolAddress,
    amount.toString(),
  ]);

  const poolConfig = NetworkConfigs.getPoolDetails(poolAddress);
  log.info("UnStaked 1 --> poolAddress: {},", [poolAddress]);

  if (poolConfig.length != THREE) {
    log.error("Invalid PoolConfig length", []);
    return;
  }
  const poolSymbol = poolConfig[0];
  const poolName = poolConfig[1];
  const hPoolName = poolConfig[2];

  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );

  updateWithdrawn(
    sdk.Pools,
    sdk.Pools,
    sdk.Tokens,
    poolName,
    poolSymbol,
    hPoolName,
    poolAddress,
    event.address.toHexString(),
    amount
  );
  sdk.Accounts.loadAccount(event.params.user);
}
