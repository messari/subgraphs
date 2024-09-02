import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";

import { Versions } from "../versions";
import { NetworkConfigs } from "../../configurations/configure";
import { getUsdPrice, getUsdPricePerToken } from "../prices";

import { SDK } from "../sdk/protocols/generic";
import { ProtocolConfig, TokenPricer } from "../sdk/protocols/config";
import { TokenInitializer, TokenParams } from "../sdk/protocols/generic/tokens";
import { bigIntToBigDecimal } from "../sdk/util/numbers";
import { ETH_ADDRESS, INT_ZERO, ZERO_ADDRESS } from "../sdk/util/constants";

import {
  Transfer,
  UpdateStrategyRewards,
  STLINK,
} from "../../generated/STLINK/STLINK";
import {
  Deposit,
  DepositTokens,
  UnqueueTokens,
  Withdraw,
  PriorityPool,
} from "../../generated/STLINK/PriorityPool";
import { _ERC20 } from "../../generated/STLINK/_ERC20";
import { Token } from "../../generated/schema";

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
    let name = "unknown";
    let symbol = "UNKNOWN";
    let decimals = INT_ZERO as i32;

    if (address == Address.fromString(ETH_ADDRESS)) {
      name = "eth";
      symbol = "ETH";
      decimals = 18 as i32;
    } else {
      const erc20 = _ERC20.bind(address);
      name = erc20.name();
      symbol = erc20.symbol();
      decimals = erc20.decimals().toI32();
    }
    return new TokenParams(name, symbol, decimals);
  }
}

export function handleTransfer(event: Transfer): void {
  if (
    event.params.from == Address.fromString(ZERO_ADDRESS) ||
    event.params.to == Address.fromString(ZERO_ADDRESS)
  ) {
    const sdk = SDK.initializeFromEvent(
      conf,
      new Pricer(),
      new TokenInit(),
      event
    );
    const token = sdk.Tokens.getOrCreateToken(NetworkConfigs.getLinkAddress());

    const pool = sdk.Pools.loadPool(event.address);
    if (!pool.isInitialized) {
      pool.initialize("Staked Link", "stLINK", [token.id], null);
    }

    const stLINK = STLINK.bind(event.address);
    const staked = stLINK.totalStaked();
    pool.setInputTokenBalances([staked], true);

    const user = event.transaction.from;
    const account = sdk.Accounts.loadAccount(user);
    account.trackActivity();
  }
}

export function handleUpdateStrategyRewards(
  event: UpdateStrategyRewards
): void {
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );
  const token = sdk.Tokens.getOrCreateToken(NetworkConfigs.getLinkAddress());

  const pool = sdk.Pools.loadPool(event.address);
  if (!pool.isInitialized) {
    pool.initialize("Staked Link", "stLINK", [token.id], null);
  }

  const fee = event.params.totalFees;
  const rewards = event.params.rewardsAmount;

  pool.addRevenueNative(token, fee, rewards);
}

export function handleDeposit(event: Deposit): void {
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );
  const token = sdk.Tokens.getOrCreateToken(NetworkConfigs.getLinkAddress());

  const pool = sdk.Pools.loadPool(event.address);
  if (!pool.isInitialized) {
    pool.initialize("Priority pool", "priority-pool", [token.id], null);
  }

  const ppContract = PriorityPool.bind(event.address);
  const queued = ppContract.totalQueued();
  pool.setInputTokenBalances([queued], true);

  const user = event.transaction.from;
  const account = sdk.Accounts.loadAccount(user);
  account.trackActivity();
}

export function handleDepositTokens(event: DepositTokens): void {
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );
  const token = sdk.Tokens.getOrCreateToken(NetworkConfigs.getLinkAddress());

  const pool = sdk.Pools.loadPool(event.address);
  if (!pool.isInitialized) {
    pool.initialize("Priority pool", "priority-pool", [token.id], null);
  }

  const ppContract = PriorityPool.bind(event.address);
  const queued = ppContract.totalQueued();
  pool.setInputTokenBalances([queued], true);
}

export function handleUnqueueTokens(event: UnqueueTokens): void {
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );
  const token = sdk.Tokens.getOrCreateToken(NetworkConfigs.getLinkAddress());

  const pool = sdk.Pools.loadPool(event.address);
  if (!pool.isInitialized) {
    pool.initialize("Priority pool", "priority-pool", [token.id], null);
  }

  const ppContract = PriorityPool.bind(event.address);
  const queued = ppContract.totalQueued();
  pool.setInputTokenBalances([queued], true);
}

export function handleWithdraw(event: Withdraw): void {
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );
  const token = sdk.Tokens.getOrCreateToken(NetworkConfigs.getLinkAddress());

  const pool = sdk.Pools.loadPool(event.address);
  if (!pool.isInitialized) {
    pool.initialize("Priority pool", "priority-pool", [token.id], null);
  }

  const ppContract = PriorityPool.bind(event.address);
  const queued = ppContract.totalQueued();
  pool.setInputTokenBalances([queued], true);

  const user = event.transaction.from;
  const account = sdk.Accounts.loadAccount(user);
  account.trackActivity();
}
