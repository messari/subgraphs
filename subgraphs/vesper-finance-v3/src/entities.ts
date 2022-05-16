import {
  YieldAggregator,
  Vault,
  Token,
  RewardToken,
  VaultFee,
  Deposit,
  Withdraw,
  Account,
  ActiveAccount,
} from "../generated/schema";
import { CONTROLLER_ADDRESS_HEX, VESPER_TOKEN } from "./constant";
import { BigDecimal, Address, BigInt, log } from "@graphprotocol/graph-ts";
import {
  PoolV3,
  TransferCall,
  DepositCall,
  WithdrawCall,
} from "../generated/vaUSDC_prod_RL4/PoolV3";
import { Erc20Token } from "../generated/vaUSDC_prod_RL4/Erc20Token";
import { PoolRewards } from "../generated/vaUSDC_prod_RL4/PoolRewards";
import { PoolRewardsOld } from "../generated/vaUSDC_prod_RL4/PoolRewardsOld";
import { getDay, getHour } from "./utils";
import { getUsdPrice } from "./prices";

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
    yAggr.schemaVersion = "1.2.0";
    yAggr.subgraphVersion = "1.0.0";
    yAggr.methodologyVersion = "1.0.0";
    yAggr.network = "MAINNET";
    yAggr.type = "YIELD";
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
  const id = `DEPOSIT-${address.toHexString()}`;
  let rewardToken = RewardToken.load(id);

  if (!rewardToken) {
    const token = getOrCreateToken(address);

    rewardToken = new RewardToken(id);
    rewardToken.token = token.id;
    rewardToken.type = "DEPOSIT";
    rewardToken.save();
  }

  return rewardToken;
}

export function updateVaultFee(vault: Vault): void {
  const id = `WITHDRAWAL_FEE-${vault.id}`;
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
  const tokenAddress = poolv3.token();
  const token = Erc20Token.bind(tokenAddress);
  const oldTVL = vault.totalValueLockedUSD || BigDecimal.zero();
  const newTVL = poolv3.totalValue();
  const aggregator = getOrCreateYieldAggregator();

  vault.inputToken = tokenAddress.toHexString();
  vault.inputTokenBalance = newTVL;

  if (newTVL) {
    vault.totalValueLockedUSD = getUsdPrice(
      tokenAddress,
      newTVL.toBigDecimal()
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

export function updateVaultRewardEmission(vaultAddress: Address): void {
  const poolv3 = PoolV3.bind(vaultAddress);
  const vault = getOrCreateVault(
    vaultAddress,
    BigInt.zero(),
    BigInt.zero(),
    false
  );
  const rewardAddress = poolv3.poolRewards();

  const rewardv3 = PoolRewards.bind(rewardAddress);
  const rewardOld = PoolRewardsOld.bind(rewardAddress);
  const rewards_call = rewardv3.try_rewardPerToken();
  const amounts: BigInt[] = [];
  const usds: BigDecimal[] = [];

  if (!rewards_call.reverted) {
    for (let i = 0, k = rewards_call.value.value0.length; i < k; ++i) {
      const rtAddress = rewards_call.value.value0[i];
      const rtAmount = rewards_call.value.value1[i];
      const token = Erc20Token.bind(rtAddress);

      amounts.push(rtAmount);
      usds.push(getUsdPrice(rtAddress, rtAmount.toBigDecimal()));

      log.info("Vault reward - {}, {}, {}", [
        rewardAddress.toHexString(),
        rtAddress.toHexString(),
        rtAmount.toString(),
      ]);
    }
  } else {
    const rewardsold_call = rewardOld.try_rewardPerToken();

    if (!rewardsold_call.reverted) {
      const rtAddress = rewardOld.rewardToken();
      const rtAmount = rewardsold_call.value;
      const token = Erc20Token.bind(rtAddress);

      amounts.push(rtAmount);
      usds.push(getUsdPrice(rtAddress, rtAmount.toBigDecimal()));

      log.info("Vault reward - {}, {}, {}", [
        rewardAddress.toHexString(),
        rtAddress.toHexString(),
        rtAmount.toString(),
      ]);
    }
  }

  vault.rewardTokenEmissionsAmount = amounts;
  vault.rewardTokenEmissionsUSD = usds;
  vault.save();
}

export function getOrCreateAccount(
  address: Address,
  timestamp: BigInt
): Account {
  let activeId = `${address.toHexString()}-${getDay(timestamp)}-${getHour(
    timestamp
  )}`;
  let object = Account.load(address.toHexString());
  let dailyObject = ActiveAccount.load(activeId);

  if (!object) {
    const yAggr = getOrCreateYieldAggregator();
    object = new Account(address.toHexString());
    object.save();

    yAggr.cumulativeUniqueUsers += 1;
    yAggr.save();
  }

  if (!dailyObject) {
    dailyObject = new ActiveAccount(activeId);
    dailyObject.save();
  }
  return object;
}

export function getOrCreateTransfer(
  call: TransferCall,
  vaultAddress: Address
): Deposit {
  const id = `deposit-${call.transaction.hash.toHexString()}-${
    call.transaction.index
  }`;
  let deposit = Deposit.load(id);

  if (!deposit) {
    const yAggr = getOrCreateYieldAggregator();
    const poolv3 = PoolV3.bind(vaultAddress);
    const token = getOrCreateToken(poolv3.token());
    getOrCreateAccount(call.from, call.block.timestamp);

    deposit = new Deposit(id);
    deposit.vault = vaultAddress.toHexString();
    deposit.hash = call.transaction.hash.toHexString();
    deposit.logIndex = call.transaction.index.toI32();
    deposit.protocol = yAggr.id;
    deposit.to = call.to.toHexString();
    deposit.from = call.from.toHexString();
    deposit.blockNumber = call.block.number;
    deposit.timestamp = call.block.timestamp;
    deposit.asset = getOrCreateToken(poolv3.token()).id;
    deposit.amount = call.inputs.amount;
    deposit.amountUSD = getUsdPrice(
      Address.fromString(token.id),
      call.inputs.amount.toBigDecimal()
    );

    deposit.save();
  }

  return deposit;
}

export function getOrCreateDeposit(
  call: DepositCall,
  vaultAddress: Address
): Deposit {
  const id = `deposit-${call.transaction.hash.toHexString()}-${
    call.transaction.index
  }`;
  let deposit = Deposit.load(id);

  if (!deposit) {
    const yAggr = getOrCreateYieldAggregator();
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
    deposit.amountUSD = getUsdPrice(
      Address.fromString(token.id),
      call.inputs._amount.toBigDecimal()
    );

    deposit.save();
  }

  return deposit;
}

export function getOrCreateWithdraw(
  call: WithdrawCall,
  vaultAddress: Address
): Withdraw {
  const id = `withdraw-${call.transaction.hash.toHexString()}-${
    call.transaction.index
  }`;
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
    withdraw.amountUSD = getUsdPrice(Address.fromString(token.id), call.inputs._shares.toBigDecimal());

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
    vault.outputTokenPriceUSD = getUsdPrice(tokenAddress, supply_call.value.toBigDecimal());

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
    const outputToken = getOrCreateToken(VESPER_TOKEN);

    vault = new Vault(address.toHexString());
    vault.outputToken = outputToken.id;
    vault.createdTimestamp = blockTimestamp;
    vault.createdBlockNumber = blockNumber;
    vault.protocol = yAggr.id;
    vault.name = poolv3.name();
    vault.symbol = poolv3.symbol();
    vault.pricePerShare = poolv3.pricePerShare().toBigDecimal();

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
