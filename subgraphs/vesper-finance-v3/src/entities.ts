import {
  YieldAggregator,
  Vault,
  Token,
  RewardToken,
  VaultFee,
  Deposit,
  Withdraw,
  Account,
  DailyActiveAccount,
} from "../generated/schema";
import { CONTROLLER_ADDRESS_HEX, VVSP_ADDRESS } from "./constant";
import { BigDecimal, Address, BigInt, log } from "@graphprotocol/graph-ts";
import {
  PoolV3,
  Transfer,
  Withdraw as WithdrawEvent,
  Deposit as DepositEvent,
  TransferCall,
  DepositCall,
  WithdrawCall,
} from "../generated/poolV3_vaUSDC/PoolV3";
import { StrategyV3 } from "../generated/poolV3_vaUSDC/StrategyV3";
import { Erc20Token } from "../generated/poolV3_vaUSDC/Erc20Token";
import { PoolRewards } from "../generated/poolV3_vaUSDC/PoolRewards";
import { PoolRewardsOld } from "../generated/poolV3_vaUSDC/PoolRewardsOld";
import { toUsd } from "./peer";
import { getDay } from "./utils";

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
  const token = Erc20Token.bind(tokenAddress);
  const oldTVL = vault.totalValueLockedUSD || BigDecimal.zero();
  const newTVL = poolv3.totalValue();
  const aggregator = getOrCreateYieldAggregator();

  inputTokens.push(tokenAddress.toHexString());
  inputTokenBalances.push(poolv3.totalValue());

  vault.inputTokens = inputTokens;
  vault.inputTokenBalances = inputTokenBalances;

  if (newTVL) {
    vault.totalValueLockedUSD = toUsd(
      newTVL.toBigDecimal(),
      token.decimals(),
      tokenAddress
    );

    aggregator.totalValueLockedUSD = aggregator.totalValueLockedUSD
      .minus(oldTVL)
      .plus(vault.totalValueLockedUSD);
  }

  vault.save();
  aggregator.save();
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
  address: Address,
  timestamp: BigInt
): Account {
  let dailyId = `${getDay(timestamp)}-${address.toHexString()}`;
  let object = Account.load(address.toHexString());
  let dailyObject = DailyActiveAccount.load(dailyId);
  let created = false;

  if (!object) {
    const yAggr = getOrCreateYieldAggregator();
    object = new Account(address.toHexString());
    object.save();
    created = true;
    yAggr.totalUniqueUsers += 1;
    yAggr.save();
  }

  if (!dailyObject) {
    dailyObject = new DailyActiveAccount(dailyId);
    dailyObject.save();
  }
  return object;
}

export function getOrCreateTransfer(
  call: TransferCall,
  vaultAddress: Address
): Deposit {
  const id = `${call.transaction.hash.toHexString()}-${call.transaction.index}`;
  let deposit = Deposit.load(id);

  if (!deposit) {
    const yAggr = getOrCreateYieldAggregator();
    const vault = getOrCreateVault(
      vaultAddress,
      call.block.number,
      call.block.timestamp,
      false
    );
    const poolv3 = PoolV3.bind(vaultAddress);
    const token = getOrCreateToken(poolv3.token());
    getOrCreateAccount(call.from, call.block.timestamp);

    deposit = new Deposit(id);
    deposit.vault = vault.id;
    deposit.hash = call.transaction.hash.toHexString();
    deposit.logIndex = call.transaction.index.toI32();
    deposit.protocol = yAggr.id;
    deposit.to = call.to.toHexString();
    deposit.from = call.from.toHexString();
    deposit.blockNumber = call.block.number;
    deposit.timestamp = call.block.timestamp;
    deposit.asset = getOrCreateToken(poolv3.token()).id;
    deposit.amount = call.inputs.amount;
    deposit.amountUSD = toUsd(
      call.inputs.amount.toBigDecimal(),
      token.decimals,
      Address.fromString(token.id)
    );

    vault.totalVolumeUSD = vault.totalVolumeUSD.plus(deposit.amountUSD);
    yAggr.totalVolumeUSD = yAggr.totalVolumeUSD.plus(deposit.amountUSD);

    deposit.save();
    vault.save();
    yAggr.save();
  }

  return deposit;
}

export function getOrCreateDeposit(
  call: DepositCall,
  vaultAddress: Address
): Deposit {
  const id = `${call.transaction.hash.toHexString()}-${call.transaction.index}`;
  let deposit = Deposit.load(id);

  if (!deposit) {
    const yAggr = getOrCreateYieldAggregator();
    const vault = getOrCreateVault(
      vaultAddress,
      call.block.number,
      call.block.timestamp,
      false
    );
    const poolv3 = PoolV3.bind(vaultAddress);
    const token = getOrCreateToken(poolv3.token());
    getOrCreateAccount(call.from, call.block.timestamp);

    deposit = new Deposit(id);
    deposit.vault = vaultAddress.toHexString();
    deposit.hash = call.transaction.hash.toHexString();
    deposit.logIndex = call.transaction.index.toI32();
    deposit.protocol = yAggr.id;
    deposit.to = vaultAddress.toHexString();
    deposit.from = call.from.toHexString();
    deposit.blockNumber = call.block.number;
    deposit.timestamp = call.block.timestamp;
    deposit.asset = getOrCreateToken(poolv3.token()).id;
    deposit.amount = call.inputs._amount;
    deposit.amountUSD = toUsd(
      call.inputs._amount.toBigDecimal(),
      token.decimals,
      Address.fromString(token.id)
    );

    vault.totalVolumeUSD = vault.totalVolumeUSD.plus(deposit.amountUSD);
    yAggr.totalVolumeUSD = yAggr.totalVolumeUSD.plus(deposit.amountUSD);

    deposit.save();
    vault.save();
    yAggr.save();
  }

  return deposit;
}

export function getOrCreateWithdraw(
  call: WithdrawCall,
  vaultAddress: Address
): Withdraw {
  const id = `${call.transaction.hash.toHexString()}-${call.transaction.index}`;
  let withdraw = Withdraw.load(id);

  if (!withdraw) {
    const yAggr = getOrCreateYieldAggregator();
    const poolv3 = PoolV3.bind(vaultAddress);
    const token = getOrCreateToken(poolv3.token());

    withdraw = new Withdraw(id);
    withdraw.vault = vaultAddress.toHexString();
    withdraw.hash = call.transaction.hash.toHexString();
    withdraw.logIndex = call.transaction.index.toI32();
    withdraw.protocol = yAggr.id;
    withdraw.to = vaultAddress.toHexString();
    withdraw.from = call.from.toHexString();
    withdraw.blockNumber = call.block.number;
    withdraw.timestamp = call.block.timestamp;
    withdraw.asset = getOrCreateToken(poolv3.token()).id;
    withdraw.amount = call.inputs._shares;
    withdraw.amountUSD = toUsd(
      call.inputs._shares.toBigDecimal(),
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
  const token = Erc20Token.bind(tokenAddress);

  if (!supply_call.reverted) {
    vault.outputTokenSupply = supply_call.value;
    vault.outputTokenPriceUSD = toUsd(
      supply_call.value.toBigDecimal(),
      token.decimals(),
      tokenAddress
    );

    vault.save();
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
    const outputToken = getOrCreateToken(VVSP_ADDRESS);

    vault = new Vault(address.toHexString());
    vault.outputToken = outputToken.id;
    vault.createdTimestamp = blockTimestamp;
    vault.createdBlockNumber = blockNumber;
    vault.protocol = yAggr.id;
    vault.name = poolv3.name();
    vault.symbol = poolv3.symbol();
    vault.pricePerShare = poolv3.pricePerShare();

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
