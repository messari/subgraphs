import { Address, BigDecimal, BigInt, log } from "@graphprotocol/graph-ts";

import { Versions } from "../versions";
import { NetworkConfigs } from "../../configurations/configure";
import { getUsdPrice, getUsdPricePerToken } from "../prices";

import { SDK } from "../sdk/protocols/generic";
import { ProtocolConfig, TokenPricer } from "../sdk/protocols/config";
import { TokenInitializer, TokenParams } from "../sdk/protocols/generic/tokens";
import { bigDecimalToBigInt, bigIntToBigDecimal } from "../sdk/util/numbers";
import {
  BIGDECIMAL_HUNDRED,
  BIGINT_MINUS_ONE,
  BIGINT_ZERO,
  ETH_ADDRESS,
  INT_ZERO,
  SECONDS_PER_YEAR_BI,
} from "../sdk/util/constants";

import { Token } from "../../generated/schema";
import {
  Staked as StakedCommunity,
  Unstaked as UnstakedCommunity,
  RewardVaultSet as RewardVaultSetCommunity,
} from "../../generated/CommunityStakingPool/CommunityStakingPool";
import {
  Staked as StakedOperator,
  Unstaked as UnstakedOperator,
  RewardVaultSet as RewardVaultSetOperator,
} from "../../generated/OperatorStakingPool/OperatorStakingPool";
import {
  Staked as StakedOld,
  Unstaked as UnstakedOld,
} from "../../generated/Staking/Staking";
import { LinkToken } from "../../generated/Staking/LinkToken";
import { _ERC20 } from "../../generated/Staking/_ERC20";
import { RewardVault as RewardVaultTemplate } from "../../generated/templates";
import {
  CommunityPoolRewardUpdated,
  OperatorPoolRewardUpdated,
} from "../../generated/templates/RewardVault/RewardVault";

const conf = new ProtocolConfig(
  NetworkConfigs.getProtocolId(),
  NetworkConfigs.getProtocolName(),
  NetworkConfigs.getProtocolSlug(),
  Versions
);

class Pricer implements TokenPricer {
  getTokenPrice(token: Token): BigDecimal {
    return getUsdPricePerToken(Address.fromBytes(token.id)).usdPrice;
  }

  getAmountValueUSD(token: Token, amount: BigInt): BigDecimal {
    const _amount = bigIntToBigDecimal(amount, token.decimals);
    return getUsdPrice(Address.fromBytes(token.id), _amount);
  }
}

class TokenInit implements TokenInitializer {
  getTokenParams(address: Address): TokenParams {
    const erc20 = _ERC20.bind(address);
    let name = "unknown";
    let symbol = "UNKNOWN";
    let decimals = INT_ZERO as i32;

    if (address == Address.fromString(ETH_ADDRESS)) {
      name = "eth";
      symbol = "ETH";
      decimals = 18 as i32;
    } else {
      const nameCall = erc20.try_name();
      if (!nameCall.reverted) {
        name = nameCall.value;
      } else {
        log.debug("[getTokenParams] nameCall reverted for {}", [
          address.toHexString(),
        ]);
      }
      const symbolCall = erc20.try_symbol();
      if (!symbolCall.reverted) {
        symbol = symbolCall.value;
      } else {
        log.debug("[getTokenParams] symbolCall reverted for {}", [
          address.toHexString(),
        ]);
      }
      const decimalsCall = erc20.try_decimals();
      if (!decimalsCall.reverted) {
        decimals = decimalsCall.value.toI32();
      } else {
        log.debug("[getTokenParams] decimalsCall reverted for {}", [
          address.toHexString(),
        ]);
      }
    }
    const tokenParams = new TokenParams(name, symbol, decimals);

    return tokenParams;
  }
}

export function handleStakedCommunity(event: StakedCommunity): void {
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );
  const token = sdk.Tokens.getOrCreateToken(
    Address.fromString(NetworkConfigs.getProtocolToken())
  );

  const pool = sdk.Pools.loadPool(event.address);
  if (!pool.isInitialized) {
    pool.initialize("Community Pool", token.symbol, [token.id], null, false);
  }

  const amount = event.params.amount;
  pool.addInputTokenBalances([amount], true);

  const user = event.transaction.from;
  const account = sdk.Accounts.loadAccount(user);
  account.trackActivity();
}

export function handleUnstakedCommunity(event: UnstakedCommunity): void {
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );
  const token = sdk.Tokens.getOrCreateToken(
    Address.fromString(NetworkConfigs.getProtocolToken())
  );

  const pool = sdk.Pools.loadPool(event.address);
  if (!pool.isInitialized) {
    pool.initialize("Community Pool", token.symbol, [token.id], null, false);
  }

  const amount = event.params.amount;
  pool.addInputTokenBalances([amount.times(BIGINT_MINUS_ONE)], true);

  const user = event.transaction.from;
  const account = sdk.Accounts.loadAccount(user);
  account.trackActivity();
}

export function handleRewardVaultSetCommunity(
  event: RewardVaultSetCommunity
): void {
  RewardVaultTemplate.create(event.params.newRewardVault);
}

export function handleStakedOperator(event: StakedOperator): void {
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );
  const token = sdk.Tokens.getOrCreateToken(
    Address.fromString(NetworkConfigs.getProtocolToken())
  );

  const pool = sdk.Pools.loadPool(event.address);
  if (!pool.isInitialized) {
    pool.initialize("Operator Pool", token.symbol, [token.id], null, false);
  }

  const amount = event.params.amount;
  pool.addInputTokenBalances([amount], true);

  const user = event.transaction.from;
  const account = sdk.Accounts.loadAccount(user);
  account.trackActivity();
}

export function handleUnstakedOperator(event: UnstakedOperator): void {
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );
  const token = sdk.Tokens.getOrCreateToken(
    Address.fromString(NetworkConfigs.getProtocolToken())
  );

  const pool = sdk.Pools.loadPool(event.address);
  if (!pool.isInitialized) {
    pool.initialize("Operator Pool", token.symbol, [token.id], null, false);
  }

  const amount = event.params.amount;
  pool.addInputTokenBalances([amount.times(BIGINT_MINUS_ONE)], true);

  const user = event.transaction.from;
  const account = sdk.Accounts.loadAccount(user);
  account.trackActivity();
}

export function handleRewardVaultSetOperator(
  event: RewardVaultSetOperator
): void {
  RewardVaultTemplate.create(event.params.newRewardVault);
}

export function handleCommunityPoolRewardUpdated(
  event: CommunityPoolRewardUpdated
): void {
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );
  const token = sdk.Tokens.getOrCreateToken(
    Address.fromString(NetworkConfigs.getProtocolToken())
  );

  const pool = sdk.Pools.loadPool(
    Address.fromString(NetworkConfigs.getCommunityPool())
  );
  if (!pool.isInitialized) {
    pool.initialize("Community Pool", token.symbol, [token.id], null, false);
  }

  const tokenBalance = pool.getInputTokenBalances()[0];

  const communityRewardRate = BigDecimal.fromString("4.32")
    .div(BIGDECIMAL_HUNDRED)
    .div(SECONDS_PER_YEAR_BI.toBigDecimal());
  const operatorRewardRate = BigDecimal.fromString("0.18")
    .div(BIGDECIMAL_HUNDRED)
    .div(SECONDS_PER_YEAR_BI.toBigDecimal());

  const lastRewardUpdateTimestamp = pool.getlastRewardUpdateTimestamp();
  const timeDiff = event.block.timestamp.minus(lastRewardUpdateTimestamp);

  const communityRewardsSince = tokenBalance
    .toBigDecimal()
    .times(communityRewardRate.times(timeDiff.toBigDecimal()));
  const operatorRewardsSince = tokenBalance
    .toBigDecimal()
    .times(operatorRewardRate.times(timeDiff.toBigDecimal()));

  pool.addRevenueNative(
    token,
    bigDecimalToBigInt(operatorRewardsSince),
    bigDecimalToBigInt(communityRewardsSince)
  );
  pool.setlastRewardUpdateTimestamp(event.block.timestamp);
}

export function handleOperatorPoolRewardUpdated(
  event: OperatorPoolRewardUpdated
): void {
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );
  const token = sdk.Tokens.getOrCreateToken(
    Address.fromString(NetworkConfigs.getProtocolToken())
  );

  const pool = sdk.Pools.loadPool(
    Address.fromString(NetworkConfigs.getOperatorPool())
  );
  if (!pool.isInitialized) {
    pool.initialize("Operator Pool", token.symbol, [token.id], null, false);
  }

  const tokenBalance = pool.getInputTokenBalances()[0];

  const operatorRewardRate = BigDecimal.fromString("4.5")
    .div(BIGDECIMAL_HUNDRED)
    .div(SECONDS_PER_YEAR_BI.toBigDecimal());

  const lastRewardUpdateTimestamp = pool.getlastRewardUpdateTimestamp();
  const timeDiff = event.block.timestamp.minus(lastRewardUpdateTimestamp);

  const operatorRewardsSince = tokenBalance
    .toBigDecimal()
    .times(operatorRewardRate.times(timeDiff.toBigDecimal()));

  pool.addRevenueNative(
    token,
    bigDecimalToBigInt(operatorRewardsSince),
    BIGINT_ZERO
  );
  pool.setlastRewardUpdateTimestamp(event.block.timestamp);
}

export function handleStakedOld(event: StakedOld): void {
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );
  const token = sdk.Tokens.getOrCreateToken(
    Address.fromString(NetworkConfigs.getProtocolToken())
  );
  const pool = sdk.Pools.loadPool(event.address);
  if (!pool.isInitialized) {
    pool.initialize("Staking Pool Old", token.symbol, [token.id], null, false);
  }

  let balance = BIGINT_ZERO;
  const linkTokenContract = LinkToken.bind(
    Address.fromString(NetworkConfigs.getProtocolToken())
  );
  const balanceOfCall = linkTokenContract.try_balanceOf(event.address);
  if (!balanceOfCall.reverted) {
    balance = balanceOfCall.value;
  }
  pool.setInputTokenBalances([balance], true);

  const user = event.transaction.from;
  const account = sdk.Accounts.loadAccount(user);
  account.trackActivity();
}

export function handleUnstakedOld(event: UnstakedOld): void {
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );
  const token = sdk.Tokens.getOrCreateToken(
    Address.fromString(NetworkConfigs.getProtocolToken())
  );
  const pool = sdk.Pools.loadPool(event.address);
  if (!pool.isInitialized) {
    pool.initialize("Staking Pool Old", token.symbol, [token.id], null, false);
  }

  let balance = BIGINT_ZERO;
  const linkTokenContract = LinkToken.bind(
    Address.fromString(NetworkConfigs.getProtocolToken())
  );
  const balanceOfCall = linkTokenContract.try_balanceOf(event.address);
  if (!balanceOfCall.reverted) {
    balance = balanceOfCall.value;
  }
  pool.setInputTokenBalances([balance], true);
  const user = event.transaction.from;
  const account = sdk.Accounts.loadAccount(user);
  account.trackActivity();
}
