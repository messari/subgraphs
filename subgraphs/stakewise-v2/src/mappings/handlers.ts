import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";

import { Versions } from "../versions";
import { NetworkConfigs } from "../../configurations/configure";

import { SDK } from "../sdk/protocols/generic";
import { ProtocolConfig, TokenPricer } from "../sdk/protocols/config";
import { TokenInitializer, TokenParams } from "../sdk/protocols/generic/tokens";
import { bigDecimalToBigInt, bigIntToBigDecimal } from "../sdk/util/numbers";
import {
  BIGDECIMAL_ZERO,
  BIGINT_TEN_TO_EIGHTEENTH,
  BIGINT_ZERO,
  ETH_ADDRESS,
  INT_ZERO,
  ZERO_ADDRESS,
} from "../sdk/util/constants";

import {
  Transfer as TransferRewardEthToken,
  RewardEthToken,
  RewardsUpdated,
} from "../../generated/RewardEthToken/RewardEthToken";
import {
  Transfer as TransferStakedEthToken,
  StakedEthToken,
} from "../../generated/StakedEthToken/StakedEthToken";
import { ValidatorRegistered } from "../../generated/Solos/Solos";
import { VaultAdded } from "../../generated/VaultsRegistry/VaultsRegistry";
import { Vault } from "../../generated/VaultsRegistry/Vault";
import { StateUpdated } from "../../generated/OsTokenVaultController/OsTokenVaultController";
import { Vault as VaultTemplate } from "../../generated/templates";
import { Deposited, Redeemed } from "../../generated/VaultsRegistry/Vault";
import { _ERC20 } from "../../generated/RewardEthToken/_ERC20";
import { ChainlinkDataFeed } from "../../generated/RewardEthToken/ChainlinkDataFeed";
import { Token } from "../../generated/schema";

const conf = new ProtocolConfig(
  NetworkConfigs.getProtocolId(),
  NetworkConfigs.getProtocolName(),
  NetworkConfigs.getProtocolSlug(),
  Versions
);

class Pricer implements TokenPricer {
  getTokenPrice(token: Token): BigDecimal {
    if (Address.fromBytes(token.id) == Address.fromString(ETH_ADDRESS)) {
      const chainlinkDataFeedContract = ChainlinkDataFeed.bind(
        Address.fromString("0x5f4ec3df9cbd43714fe2740f5e3616155c5b8419") // ETH / USD feed
      );
      const result = chainlinkDataFeedContract.latestAnswer();
      const decimals = chainlinkDataFeedContract.decimals();
      return bigIntToBigDecimal(result, decimals);
    }
    return BIGDECIMAL_ZERO;
  }

  getAmountValueUSD(token: Token, amount: BigInt): BigDecimal {
    const usdPrice = this.getTokenPrice(token);
    const _amount = bigIntToBigDecimal(amount, token.decimals);

    return usdPrice.times(_amount);
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

export function handleTransferRewardEthToken(
  event: TransferRewardEthToken
): void {
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );
  const token = sdk.Tokens.getOrCreateToken(Address.fromString(ETH_ADDRESS));
  const pool = sdk.Pools.loadPool(event.address);
  if (!pool.isInitialized) {
    pool.initialize("Reward Eth Token", "rETH2", [token.id], null);
  }

  const contract = RewardEthToken.bind(event.address);
  const supply = contract.totalSupply();
  pool.setInputTokenBalances([supply], true);

  if (event.params.from == Address.fromString(ZERO_ADDRESS)) {
    const user = event.params.to;
    const account = sdk.Accounts.loadAccount(user);
    account.trackActivity();
  }
  if (event.params.to == Address.fromString(ZERO_ADDRESS)) {
    const user = event.params.from;
    const account = sdk.Accounts.loadAccount(user);
    account.trackActivity();
  }
}

export function handleTransferStakedEthToken(
  event: TransferStakedEthToken
): void {
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );
  const token = sdk.Tokens.getOrCreateToken(Address.fromString(ETH_ADDRESS));
  const pool = sdk.Pools.loadPool(event.address);
  if (!pool.isInitialized) {
    pool.initialize("Staked Eth Token", "sETH2", [token.id], null);
  }

  const contract = StakedEthToken.bind(event.address);
  const supply = contract.totalSupply();
  pool.setInputTokenBalances([supply], true);

  if (event.params.from == Address.fromString(ZERO_ADDRESS)) {
    const user = event.params.to;
    const account = sdk.Accounts.loadAccount(user);
    account.trackActivity();
  }
  if (event.params.to == Address.fromString(ZERO_ADDRESS)) {
    const user = event.params.from;
    const account = sdk.Accounts.loadAccount(user);
    account.trackActivity();
  }
}

export function handleValidatorRegistered(event: ValidatorRegistered): void {
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );
  const token = sdk.Tokens.getOrCreateToken(Address.fromString(ETH_ADDRESS));
  const pool = sdk.Pools.loadPool(event.address);
  if (!pool.isInitialized) {
    pool.initialize("Solos", "solo", [token.id], null);
  }

  pool.addInputTokenBalances(
    [BigInt.fromI32(32).times(BIGINT_TEN_TO_EIGHTEENTH)],
    true
  );

  const user = event.transaction.from;
  const account = sdk.Accounts.loadAccount(user);
  account.trackActivity();
}

export function handleVaultAdded(event: VaultAdded): void {
  VaultTemplate.create(event.params.vault);
}

export function handleDeposited(event: Deposited): void {
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );
  const token = sdk.Tokens.getOrCreateToken(Address.fromString(ETH_ADDRESS));
  const pool = sdk.Pools.loadPool(event.address);
  if (!pool.isInitialized) {
    pool.initialize(
      event.address.toHexString(),
      event.address.toHexString(),
      [token.id],
      null
    );
  }

  const contract = Vault.bind(event.address);
  const supply = contract.totalAssets();
  pool.setInputTokenBalances([supply], true);

  const user = event.transaction.from;
  const account = sdk.Accounts.loadAccount(user);
  account.trackActivity();
}

export function handleRedeemed(event: Redeemed): void {
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );
  const token = sdk.Tokens.getOrCreateToken(Address.fromString(ETH_ADDRESS));
  const pool = sdk.Pools.loadPool(event.address);
  if (!pool.isInitialized) {
    pool.initialize(
      event.address.toHexString(),
      event.address.toHexString(),
      [token.id],
      null
    );
  }

  const contract = Vault.bind(event.address);
  const supply = contract.totalAssets();
  pool.setInputTokenBalances([supply], true);

  const user = event.transaction.from;
  const account = sdk.Accounts.loadAccount(user);
  account.trackActivity();
}

export function handleRewardsUpdated(event: RewardsUpdated): void {
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );
  const token = sdk.Tokens.getOrCreateToken(Address.fromString(ETH_ADDRESS));
  const pool = sdk.Pools.loadPool(event.address);
  if (!pool.isInitialized) {
    pool.initialize("Reward Eth Token", "rETH2", [token.id], null);
  }

  const amount = event.params.periodRewards;
  const fees = amount.toBigDecimal().times(BigDecimal.fromString("0.05"));
  const rewards = amount.toBigDecimal().minus(fees);
  pool.addRevenueNative(
    token,
    bigDecimalToBigInt(rewards),
    bigDecimalToBigInt(fees)
  );
}

export function handleStateUpdated(event: StateUpdated): void {
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );
  const token = sdk.Tokens.getOrCreateToken(Address.fromString(ETH_ADDRESS));
  const pool = sdk.Pools.loadPool(event.address);
  if (!pool.isInitialized) {
    pool.initialize("OsToken Rewards", "OsToken", [token.id], null);
  }

  const amount = event.params.profitAccrued;
  const fees = amount.toBigDecimal().times(BigDecimal.fromString("0.1"));
  const rewards = amount.toBigDecimal().minus(fees);
  pool.addRevenueNative(
    token,
    bigDecimalToBigInt(rewards),
    bigDecimalToBigInt(fees)
  );
}
