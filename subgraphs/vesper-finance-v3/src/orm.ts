import {
  YieldAggregator,
  Vault,
  Token,
  RewardToken,
  VaultFee,
  Deposit,
  Withdraw,
  Account,
} from "../generated/schema";
import { CONTROLLER_ADDRESS_HEX } from "./constant";
import { BigDecimal, Address, BigInt, log } from "@graphprotocol/graph-ts";
import {
  PoolV3,
  Transfer,
  Withdraw as WithdrawEvent,
  Deposit as DepositEvent,
} from "../generated/poolV3_vaUSDC/PoolV3";
import { StrategyV3 } from "../generated/poolV3_vaUSDC/StrategyV3";
import { Erc20Token } from "../generated/poolV3_vaUSDC/Erc20Token";
import { PoolRewards } from "../generated/poolV3_vaUSDC/PoolRewards";
import { PoolRewardsOld } from "../generated/poolV3_vaUSDC/PoolRewardsOld";
import { toUsd, getShareToTokenRateV3, getDecimalDivisor } from "./peer";

interface getOrCreateResponse<T> {
  object: T;
  created: boolean;
}

export function getOrCreateYieldAggregator(): YieldAggregator {
  let yAggr = YieldAggregator.load(CONTROLLER_ADDRESS_HEX);

  if (!yAggr) {
    yAggr = new YieldAggregator(CONTROLLER_ADDRESS_HEX);
    yAggr.name = "Vesper Finance V3";
    yAggr.slug = "vesper-finance-v3";
    yAggr.schemaVersion = "1.0.0";
    yAggr.subgraphVersion = "1.0.0";
    yAggr.network = "ETHEREUM";
    yAggr.type = "YIELD";
    yAggr.totalUniqueUsers = 0;
    yAggr.totalValueLockedUSD = BigDecimal.zero();
    yAggr.save();
  }

  return yAggr;
}

export function getOrCreateToken(address: Address): Token {
  let token = Token.load(address.toHexString());

  if (!token) {
    const erc20Token = Erc20Token.bind(address);
    token = new Token(address.toHexString());
    token.name = erc20Token.name();
    token.symbol = erc20Token.symbol();
    token.decimals = erc20Token.decimals();
    token.save();
  }

  return token;
}
export function getOrCreateRewardToken(address: Address): RewardToken {
  let token = RewardToken.load(address.toHexString());

  if (!token) {
    const erc20Token = Erc20Token.bind(address);
    token = new RewardToken(address.toHexString());
    token.type = "DEPOSIT";
    token.name = erc20Token.name();
    token.symbol = erc20Token.symbol();
    token.decimals = erc20Token.decimals();
    token.save();
  }

  return token;
}

export function updateVaultFee(vault: Vault): void {
  // const id = `WITHDRAWAL_FEE_${vault.id}`;
  const id = vault.id;
  const vaultAddress = Address.fromString(vault.id);
  const poolv3 = PoolV3.bind(vaultAddress);
  let fee = VaultFee.load(id);

  if (fee) {
    fee.feePercentage = poolv3.withdrawFee().toBigDecimal();
  } else {
    fee = new VaultFee(id);
    fee.feePercentage = poolv3.withdrawFee().toBigDecimal();
    fee.feeType = "WITHDRAWAL_FEE";
  }

  vault.fees = [fee.id];
  fee.save();
  vault.save();
}

export function updateVaultTokens(vault: Vault): void {
  const vaultAddress = Address.fromString(vault.id);
  const poolv3 = PoolV3.bind(vaultAddress);
  const strategyAddresses = poolv3.getStrategies();
  const inputTokens: string[] = [];
  const inputTokenBalances: BigInt[] = [];
  const tokenAddress = poolv3.token();

  inputTokens.push(tokenAddress.toHexString());
  inputTokenBalances.push(poolv3.totalValue());

  vault.inputTokens = inputTokens;
  vault.inputTokenBalances = inputTokenBalances;

  vault.save();
}

export function updateVaultRewardTokens(vault: Vault): void {
  const vaultAddress = Address.fromString(vault.id);
  const poolv3 = PoolV3.bind(vaultAddress);
  const rewardAddress = poolv3.poolRewards();

  if (rewardAddress) {
    const reward = PoolRewards.bind(rewardAddress);
    const tryResponse = reward.try_getRewardTokens();
    const ids: string[] = [];
    let tokenAddresses: Address[] = [];

    if (tryResponse.reverted) {
      const rewardOld = PoolRewardsOld.bind(rewardAddress);
      const tmp = rewardOld.try_rewardToken();

      if (!tmp.reverted) {
        tokenAddresses = [tmp.value];
      }
    } else {
      tokenAddresses = tryResponse.value;
    }

    for (let i = 0, k = tokenAddresses.length; i < k; ++i) {
      const rt = getOrCreateRewardToken(tokenAddresses[i]);
      ids.push(rt.id);
    }

    if (ids.length) {
      vault.rewardTokens = ids;
      vault.save();
    }
  }
}

export function getOrCreateAccount(
  address: Address
): Account {
  let object = Account.load(address.toHexString());
  let created = false;

  if (!object) {
    const yAggr = getOrCreateYieldAggregator();
    object = new Account(address.toHexString());
    object.save();
    created = true;
    yAggr.totalUniqueUsers += 1;
    yAggr.save();
  }

  return object;
}

export function getOrCreateTransfer(
  event: Transfer,
  vaultAddress: Address
): Deposit {
  const id = `${event.transaction.hash.toHexString()}-${event.logIndex}`;
  let deposit = Deposit.load(id);

  if (!deposit) {
    const yAggr = getOrCreateYieldAggregator();
    const poolv3 = PoolV3.bind(vaultAddress);
    const token = getOrCreateToken(poolv3.token());
    getOrCreateAccount(event.params.from);

    deposit = new Deposit(id);
    deposit.vault = vaultAddress.toHexString();
    deposit.hash = event.transaction.hash.toHexString();
    deposit.logIndex = event.logIndex.toI32();
    deposit.protocol = yAggr.id;
    deposit.to = event.params.to.toHexString();
    deposit.from = event.params.from.toHexString();
    deposit.blockNumber = event.block.number;
    deposit.timestamp = event.block.timestamp;
    deposit.asset = getOrCreateToken(poolv3.token()).id;
    deposit.amount = event.params.value;
    deposit.amountUSD = toUsd(
      event.params.value.toBigDecimal(),
      token.decimals,
      Address.fromString(token.id)
    );

    deposit.save();

    // if (accountRes.created) {
    //   yAggr.totalUniqueUsers += 1;
    //   yAggr.save();
    // }
  }

  return deposit;
}

export function getOrCreateDeposit(
  event: DepositEvent,
  vaultAddress: Address
): Deposit {
  const id = `${event.transaction.hash.toHexString()}-${event.logIndex}`;
  let deposit = Deposit.load(id);

  if (!deposit) {
    const yAggr = getOrCreateYieldAggregator();
    const poolv3 = PoolV3.bind(vaultAddress);
    const token = getOrCreateToken(poolv3.token());
    getOrCreateAccount(event.params.owner);

    deposit = new Deposit(id);
    deposit.vault = vaultAddress.toHexString();
    deposit.hash = event.transaction.hash.toHexString();
    deposit.logIndex = event.logIndex.toI32();
    deposit.protocol = yAggr.id;
    deposit.to = vaultAddress.toHexString();
    deposit.from = event.params.owner.toHexString();
    deposit.blockNumber = event.block.number;
    deposit.timestamp = event.block.timestamp;
    deposit.asset = getOrCreateToken(poolv3.token()).id;
    deposit.amount = event.params.amount;
    deposit.amountUSD = toUsd(
      event.params.shares.toBigDecimal(),
      token.decimals,
      Address.fromString(token.id)
    );

    deposit.save();

    // if (accountRes.created) {
    //   yAggr.totalUniqueUsers += 1;
    //   yAggr.save();
    // }
  }

  return deposit;
}

export function getOrCreateWithdraw(
  event: WithdrawEvent,
  vaultAddress: Address
): Withdraw {
  const id = `${event.transaction.hash.toHexString()}-${event.logIndex}`;
  let withdraw = Withdraw.load(id);

  if (!withdraw) {
    const yAggr = getOrCreateYieldAggregator();
    const poolv3 = PoolV3.bind(vaultAddress);
    const token = getOrCreateToken(poolv3.token());

    withdraw = new Withdraw(id);
    withdraw.vault = vaultAddress.toHexString();
    withdraw.hash = event.transaction.hash.toHexString();
    withdraw.logIndex = event.logIndex.toI32();
    withdraw.protocol = yAggr.id;
    withdraw.to = vaultAddress.toHexString();
    withdraw.from = event.params.owner.toHexString();
    withdraw.blockNumber = event.block.number;
    withdraw.timestamp = event.block.timestamp;
    withdraw.asset = getOrCreateToken(poolv3.token()).id;
    withdraw.amount = event.params.amount;
    withdraw.amountUSD = toUsd(
      event.params.amount.toBigDecimal(),
      token.decimals,
      Address.fromString(token.id)
    );

    withdraw.save();
  }

  return withdraw;
}

export function updateVaultSupply(vault: Vault): void {
  const vaultAddress = Address.fromString(vault.id);
  const poolv3 = PoolV3.bind(vaultAddress);
  const tokenAddress = poolv3.token();
  const supply_call = poolv3.try_totalSupply();
  const value_call = poolv3.try_totalValue();
  const debt_call = poolv3.try_totalDebt();
  const token = Erc20Token.bind(tokenAddress);
  const aggregator = getOrCreateYieldAggregator();

  if (!supply_call.reverted) {
    const shareRate = getShareToTokenRateV3(poolv3);
    vault.outputTokenSupply = supply_call.value;
    vault.outputTokenPriceUSD = toUsd(
      supply_call.value.toBigDecimal(),
      token.decimals(),
      tokenAddress
    );

    vault.save();
  }

  if (!value_call.reverted) {
    vault.totalVolumeUSD = toUsd(
      value_call.value.toBigDecimal(),
      token.decimals(),
      tokenAddress
    );

    vault.save();

    aggregator.totalVolumeUSD = aggregator.totalVolumeUSD.plus(
      vault.totalVolumeUSD
    );
    aggregator.save();
  }

  if (!debt_call.reverted) {
    vault.totalValueLockedUSD = toUsd(
      debt_call.value.toBigDecimal(),
      token.decimals(),
      tokenAddress
    );

    vault.save();

    aggregator.totalValueLockedUSD = aggregator.totalValueLockedUSD.plus(
      vault.totalValueLockedUSD
    );
    aggregator.save();
  }
}

export function getOrCreateVault(
  address: Address,
  blockNumber: BigInt = BigInt.zero(),
  blockTimestamp: BigInt = BigInt.zero(),
  updateOp: boolean = true
): Vault {
  let vault = Vault.load(address.toHexString());

  if (!vault) {
    const yAggr = getOrCreateYieldAggregator();
    const poolv3 = PoolV3.bind(address);

    vault = new Vault(address.toHexString());
    vault.outputToken = address.toHexString();
    vault.totalValueLockedUSD = BigDecimal.zero();
    vault.totalVolumeUSD = BigDecimal.zero();
    vault.outputTokenSupply = BigInt.zero();
    vault.outputTokenPriceUSD = BigDecimal.zero();
    vault.createdTimestamp = blockTimestamp;
    vault.createdBlockNumber = blockNumber;
    vault.protocol = yAggr.id;
    vault.name = poolv3.name();
    vault.symbol = poolv3.symbol();
    vault.depositLimit = BigInt.zero();

    vault.save();
  }

  if (updateOp) {
    updateVaultFee(vault);
    updateVaultTokens(vault);
    updateVaultRewardTokens(vault);
    updateVaultSupply(vault);
  }

  return vault;
}
