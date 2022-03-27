import * as constants from "../common/constants";
import { DEFAULT_DECIMALS } from "../common/constants";
import {
  Token,
  RewardToken,
  Vault as VaultStore,
  VaultFee,
  VaultDailySnapshot,
  FinancialsDailySnapshot,
} from "../../generated/schema";
import { BigInt, ethereum, Address, BigDecimal } from "@graphprotocol/graph-ts";
import { ERC20 as ERC20Contract } from "../../generated/Controller/ERC20";

export function getTimeInMillis(time: BigInt): BigInt {
  return time.times(BigInt.fromI32(1000));
}

export function getTimestampInMillis(block: ethereum.Block): BigInt {
  return block.timestamp.times(BigInt.fromI32(1000));
}

export function getOrCreateToken(address: Address): Token {
  let token = Token.load(address.toHexString());
  if (!token) {
    token = new Token(address.toHexString());

    let erc20Contract = ERC20Contract.bind(address);
    let name = erc20Contract.try_name();
    let symbol = erc20Contract.try_symbol();
    let decimals = erc20Contract.try_decimals();

    token.name = name.reverted ? "" : name.value;
    token.symbol = symbol.reverted ? "" : symbol.value;
    token.decimals = decimals.reverted
      ? DEFAULT_DECIMALS
      : decimals.value.toI32();

    token.save();
  }
  return token as Token;
}

export function getOrCreateRewardToken(address: Address): RewardToken {
  let rewardToken = RewardToken.load(address.toHexString());
  if (!rewardToken) {
    rewardToken = new RewardToken(address.toHexString());

    let erc20Contract = ERC20Contract.bind(address);
    let name = erc20Contract.try_name();
    let symbol = erc20Contract.try_symbol();
    let decimals = erc20Contract.try_decimals();

    rewardToken.name = name.reverted ? "" : name.value;
    rewardToken.symbol = symbol.reverted ? "" : symbol.value;
    rewardToken.decimals = decimals.reverted
      ? DEFAULT_DECIMALS
      : decimals.value.toI32();

    rewardToken.type = constants.RewardTokenType.DEPOSIT;
    rewardToken.save();
  }
  return rewardToken as RewardToken;
}

export function getFeePercentage(
  vaultAddress: string,
  feeType: string
): BigDecimal {
  let feesPercentage: BigDecimal = BigDecimal.fromString("0");
  const vault = VaultStore.load(vaultAddress);

  for (let i = 0; i < vault!.fees.length; i++) {
    const vaultFee = VaultFee.load(vault!.fees[i]);

    if (vaultFee!.feeType == feeType) {
      feesPercentage = vaultFee!.feePercentage;
    }
  }

  return feesPercentage;
}

export function getOrCreateFinancialSnapshots(
  financialSnapshotId: string
): FinancialsDailySnapshot {
  let financialMetrics = FinancialsDailySnapshot.load(financialSnapshotId);

  if (!financialMetrics) {
    financialMetrics = new FinancialsDailySnapshot(financialSnapshotId);
    financialMetrics.protocol = constants.ETHEREUM_PROTOCOL_ID;

    financialMetrics.feesUSD = constants.BIGDECIMAL_ZERO;
    financialMetrics.totalVolumeUSD = constants.BIGDECIMAL_ZERO;
    financialMetrics.totalValueLockedUSD = constants.BIGDECIMAL_ZERO;
    financialMetrics.supplySideRevenueUSD = constants.BIGDECIMAL_ZERO;
    financialMetrics.protocolSideRevenueUSD = constants.BIGDECIMAL_ZERO;
  }

  return financialMetrics;
}

export function getOrCreateVaultSnapshots(
  vaultSnapshotsId: string
): VaultDailySnapshot {
  let vaultSnapshots = VaultDailySnapshot.load(vaultSnapshotsId);

  if (!vaultSnapshots) {
    vaultSnapshots = new VaultDailySnapshot(vaultSnapshotsId);
    vaultSnapshots.protocol = constants.ETHEREUM_PROTOCOL_ID;

    vaultSnapshots.totalValueLockedUSD = constants.BIGDECIMAL_ZERO;
    vaultSnapshots.totalVolumeUSD = constants.BIGDECIMAL_ZERO;
    vaultSnapshots.inputTokenBalances = [constants.BIGINT_ZERO];
    vaultSnapshots.outputTokenSupply = constants.BIGINT_ZERO;
    vaultSnapshots.outputTokenPriceUSD = constants.BIGDECIMAL_ZERO;
    vaultSnapshots.rewardTokenEmissionsAmount = [constants.BIGINT_ZERO];
    vaultSnapshots.rewardTokenEmissionsUSD = [constants.BIGDECIMAL_ZERO];
  }

  return vaultSnapshots;
}
