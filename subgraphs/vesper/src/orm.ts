import {
  YieldAggregator,
  Vault,
  Token,
  RewardToken,
  VaultFee,
} from "../generated/schema";
import { CONTROLLER_ADDRESS_HEX } from "./constant";
import { BigDecimal, Address, BigInt, log } from "@graphprotocol/graph-ts";
import { PoolV3 } from "../generated/poolV3_vaUSDC/PoolV3";
import { StrategyV3 } from "../generated/poolV3_vaUSDC/StrategyV3";
import { Erc20Token } from "../generated/poolV3_vaUSDC/Erc20Token";
import { PoolRewards } from "../generated/poolV3_vaUSDC/PoolRewards";

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

export function getOrCreateVaultFee(address: Address): VaultFee {
  const id = `WITHDRAWAL_FEE_${address.toHexString()}`;
  let fee = VaultFee.load(id);

  if (!fee) {
    const poolv3 = PoolV3.bind(address);
    fee = new VaultFee(id);
    fee.feePercentage = poolv3.withdrawFee().toBigDecimal();
    fee.feeType = "WITHDRAWAL_FEE";
    fee.save();
  }

  return fee;
}

export function getOrCreateVault(address: Address): Vault {
  let vault = Vault.load(address.toHexString());

  if (!vault) {
    const yAggr = getOrCreateYieldAggregator();
    const fee = getOrCreateVaultFee(address);
    const poolv3 = PoolV3.bind(address);
    const strategyAddresses = poolv3.getStrategies();
    const reward = PoolRewards.bind(poolv3.poolRewards());
    // const rewardTokenAddresses = reward.getRewardTokens();
    const inputTokens: string[] = [];
    const inputTokenBalances: BigInt[] = [];
    const rewardTokens: string[] = [];

    vault = new Vault(address.toHexString());
    vault.totalValueLockedUSD = BigDecimal.zero();
    vault.totalVolumeUSD = BigDecimal.zero();
    vault.outputTokenSupply = BigInt.zero();
    vault.outputTokenPriceUSD = BigDecimal.zero();
    vault.createdTimestamp = BigInt.zero();
    vault.createdBlockNumber = BigInt.zero();
    vault.protocol = yAggr.id;
    vault.name = poolv3.name();
    vault.symbol = poolv3.symbol();
    vault.depositLimit = BigInt.zero();
    vault.fees = [fee.id];

    for (let i = 0, k = strategyAddresses.length; i < k; ++i) {
      const st = StrategyV3.bind(strategyAddresses[i]);
      const inputToken = getOrCreateToken(st.collateralToken());
      inputTokens.push(inputToken.id);
      inputTokenBalances.push(BigInt.zero());

      log.info("Strategy Processed: {}", [strategyAddresses[i].toHexString()]);
    }

    // for (let i = 0, k = rewardTokenAddresses.length; i < k; ++i) {
    //   const rt = getOrCreateRewardToken(rewardTokenAddresses[i]);

    //   rewardTokens.push(rt.id);
    // }

    vault.inputTokens = inputTokens;
    vault.inputTokenBalances = inputTokenBalances;
    // vault.rewardTokens = rewardTokens;

    vault.save();
  }

  return vault;
}
