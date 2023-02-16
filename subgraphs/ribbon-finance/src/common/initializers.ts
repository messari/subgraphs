import {
  Account,
  FinancialsDailySnapshot,
  RewardToken,
  Token,
  UsageMetricsDailySnapshot,
  UsageMetricsHourlySnapshot,
  YieldAggregator,
  _Auction,
  _LiquidityGauge,
  Vault as VaultStore,
  VaultHourlySnapshot,
  VaultDailySnapshot,
  VaultFee,
  _SwapOffer,
} from "../../generated/schema";
import * as utils from "./utils";
import * as constants from "./constants";
import { getUsdPricePerToken } from "../prices";
import {
  Address,
  ethereum,
  BigInt,
  BigDecimal,
  dataSource,
} from "@graphprotocol/graph-ts";
import { ERC20 as ERC20Contract } from "../../generated/templates/LiquidityGauge/ERC20";
import { LiquidityGauge as LiquidityGaugeTemplate } from "../../generated/templates";
import { LiquidityGaugeV5 as GaugeContract } from "../../generated/templates/LiquidityGauge/LiquidityGaugeV5";
import { RibbonThetaVaultWithSwap as VaultContract } from "../../generated/templates/LiquidityGauge/RibbonThetaVaultWithSwap";
import { Versions } from "../versions";

export function getOrCreateToken(
  address: Address,
  block: ethereum.Block,
  vault: Address = constants.NULL.TYPE_ADDRESS,
  isOutputToken: bool = false
): Token {
  let token = Token.load(address.toHexString());

  if (!token) {
    token = new Token(address.toHexString());
    const contract = ERC20Contract.bind(address);
    token.name = utils.readValue<string>(contract.try_name(), "");
    token.symbol = utils.readValue<string>(contract.try_symbol(), "");
    token.decimals = utils.readValue<i32>(
      contract.try_decimals(),
      constants.DEFAULT_DECIMALS.toI32() as u8
    );
    token._vaultId = vault.toHexString();
    token.lastPriceBlockNumber = block.number;
    token._isOutputToken = isOutputToken ? true : false; //Added the ternary condition to remove type error

    if (isOutputToken) {
      token.lastPriceUSD = utils.getOutputTokenPriceUSD(vault, block);
    } else {
      token.lastPriceUSD = getUsdPricePerToken(address).usdPrice;
    }

    token.save();
  }

  if (token._vaultId) {
    if (!token._isOutputToken) {
      token.lastPriceUSD = getUsdPricePerToken(address).usdPrice;
      token.lastPriceBlockNumber = block.number;
    }
    if (token._isOutputToken) {
      token.lastPriceUSD = utils.getOutputTokenPriceUSD(vault, block);
      token.lastPriceBlockNumber = block.number;
    }
    token.save();
  }

  return token;
}
export function getOrCreateFee(
  feeId: string,
  feeType: string,
  feePercentage: BigDecimal = constants.BIGDECIMAL_ZERO
): VaultFee {
  let fees = VaultFee.load(feeId);

  if (!fees) {
    fees = new VaultFee(feeId);

    fees.feeType = feeType;
    fees.feePercentage = feePercentage;

    fees.save();
  }

  return fees;
}

export function getOrCreateRewardToken(
  tokenAddress: Address,
  vaultAddress: Address,
  block: ethereum.Block,
  isOToken: bool = false
): RewardToken {
  const tokenId =
    constants.RewardTokenType.DEPOSIT + "-" + tokenAddress.toHexString();
  let rewardToken = RewardToken.load(tokenId);
  if (!rewardToken) {
    rewardToken = new RewardToken(tokenId);
    rewardToken.token = getOrCreateToken(
      tokenAddress,
      block,
      vaultAddress,
      isOToken
    ).id;
    rewardToken.type = constants.RewardTokenType.DEPOSIT;
    rewardToken.save();
  }
  return rewardToken;
}

export function getOrCreateYieldAggregator(): YieldAggregator {
  let protocol = YieldAggregator.load(constants.PROTOCOL_ID);

  if (!protocol) {
    protocol = new YieldAggregator(constants.PROTOCOL_ID);
    protocol.name = constants.PROTOCOL_NAME;
    protocol.slug = constants.PROTOCOL_SLUG;
    protocol.network = dataSource.network().toUpperCase().replace("-", "_");
    protocol.type = constants.ProtocolType.YIELD;

    //////// Quantitative Data ////////
    protocol.totalValueLockedUSD = constants.BIGDECIMAL_ZERO;
    protocol.cumulativeSupplySideRevenueUSD = constants.BIGDECIMAL_ZERO;
    protocol.cumulativeProtocolSideRevenueUSD = constants.BIGDECIMAL_ZERO;
    protocol.cumulativeTotalRevenueUSD = constants.BIGDECIMAL_ZERO;
    protocol.cumulativeUniqueUsers = 0;
    protocol.totalPoolCount = 0;
    protocol._vaultIds = [];
  }

  protocol.schemaVersion = Versions.getSchemaVersion();
  protocol.subgraphVersion = Versions.getSubgraphVersion();
  protocol.methodologyVersion = Versions.getMethodologyVersion();

  protocol.save();

  return protocol;
}
export function getOrCreateFinancialDailySnapshots(
  block: ethereum.Block
): FinancialsDailySnapshot {
  const id = block.timestamp.toI64() / constants.SECONDS_PER_DAY;
  let financialMetrics = FinancialsDailySnapshot.load(id.toString());

  if (!financialMetrics) {
    financialMetrics = new FinancialsDailySnapshot(id.toString());
    financialMetrics.protocol = constants.PROTOCOL_ID;

    financialMetrics.totalValueLockedUSD = constants.BIGDECIMAL_ZERO;
    financialMetrics.dailySupplySideRevenueUSD = constants.BIGDECIMAL_ZERO;
    financialMetrics.cumulativeSupplySideRevenueUSD = constants.BIGDECIMAL_ZERO;
    financialMetrics.dailyProtocolSideRevenueUSD = constants.BIGDECIMAL_ZERO;
    financialMetrics.cumulativeProtocolSideRevenueUSD =
      constants.BIGDECIMAL_ZERO;

    financialMetrics.dailyTotalRevenueUSD = constants.BIGDECIMAL_ZERO;
    financialMetrics.cumulativeTotalRevenueUSD = constants.BIGDECIMAL_ZERO;

    financialMetrics.blockNumber = block.number;
    financialMetrics.timestamp = block.timestamp;

    financialMetrics.save();
  }

  return financialMetrics;
}

export function getOrCreateUsageMetricsDailySnapshot(
  block: ethereum.Block
): UsageMetricsDailySnapshot {
  const id: string = (
    block.timestamp.toI64() / constants.SECONDS_PER_DAY
  ).toString();
  let usageMetrics = UsageMetricsDailySnapshot.load(id);

  if (!usageMetrics) {
    usageMetrics = new UsageMetricsDailySnapshot(id);
    usageMetrics.protocol = constants.PROTOCOL_ID;

    usageMetrics.dailyActiveUsers = 0;
    usageMetrics.cumulativeUniqueUsers = 0;
    usageMetrics.dailyTransactionCount = 0;
    usageMetrics.dailyDepositCount = 0;
    usageMetrics.dailyWithdrawCount = 0;

    usageMetrics.blockNumber = block.number;
    usageMetrics.timestamp = block.timestamp;

    const protocol = getOrCreateYieldAggregator();
    usageMetrics.totalPoolCount = protocol.totalPoolCount;

    usageMetrics.save();
  }

  return usageMetrics;
}

export function getOrCreateUsageMetricsHourlySnapshot(
  block: ethereum.Block
): UsageMetricsHourlySnapshot {
  const metricsID: string = (
    block.timestamp.toI64() / constants.SECONDS_PER_HOUR
  ).toString();
  let usageMetrics = UsageMetricsHourlySnapshot.load(metricsID);

  if (!usageMetrics) {
    usageMetrics = new UsageMetricsHourlySnapshot(metricsID);
    usageMetrics.protocol = constants.PROTOCOL_ID;

    usageMetrics.hourlyActiveUsers = 0;
    usageMetrics.cumulativeUniqueUsers = 0;
    usageMetrics.hourlyTransactionCount = 0;
    usageMetrics.hourlyDepositCount = 0;
    usageMetrics.hourlyWithdrawCount = 0;

    usageMetrics.blockNumber = block.number;
    usageMetrics.timestamp = block.timestamp;

    usageMetrics.save();
  }

  return usageMetrics;
}

export function getOrCreateVault(
  vaultAddress: Address,
  block: ethereum.Block
): VaultStore {
  let vault = VaultStore.load(vaultAddress.toHexString());

  if (!vault) {
    vault = new VaultStore(vaultAddress.toHexString());

    const vaultContract = VaultContract.bind(vaultAddress);
    vault.name = utils.readValue<string>(vaultContract.try_name(), "");
    vault.symbol = utils.readValue<string>(vaultContract.try_symbol(), "");
    vault.protocol = constants.PROTOCOL_ID;

    vault._decimals = utils.readValue(vaultContract.try_decimals(), 0);

    vault.depositLimit = utils.readValue<BigInt>(
      vaultContract.try_cap(),
      constants.BIGINT_ZERO
    );
    let asset = utils.readValue<Address>(
      vaultContract.try_asset(),
      constants.NULL.TYPE_ADDRESS
    );
    if (asset.equals(constants.NULL.TYPE_ADDRESS)) {
      const vaultParams = vaultContract.try_vaultParams();
      if (!vaultParams.reverted) {
        asset = vaultParams.value.getAsset();
      }
      if (asset.equals(constants.NULL.TYPE_ADDRESS)) {
        const vaultParamsEarnVault = vaultContract.try_vaultParams1();
        if (!vaultParamsEarnVault.reverted) {
          asset = vaultParamsEarnVault.value.getAsset();
        }
      }
    }
    const inputToken = getOrCreateToken(asset, block, vaultAddress);
    vault.inputToken = inputToken.id;
    vault.inputTokenBalance = constants.BIGINT_ZERO;

    const outputTokenAddress = vaultAddress;

    if (outputTokenAddress.notEqual(constants.NULL.TYPE_ADDRESS)) {
      const outputToken = getOrCreateToken(
        outputTokenAddress,
        block,
        vaultAddress,
        true
      );
      vault.outputToken = outputToken.id;
    }

    vault.outputTokenSupply = constants.BIGINT_ZERO;

    vault.outputTokenPriceUSD = constants.BIGDECIMAL_ZERO;
    vault.pricePerShare = constants.BIGDECIMAL_ZERO;

    vault.createdBlockNumber = block.number;
    vault.createdTimestamp = block.timestamp;

    vault.totalValueLockedUSD = constants.BIGDECIMAL_ZERO;

    vault.cumulativeSupplySideRevenueUSD = constants.BIGDECIMAL_ZERO;
    vault.cumulativeProtocolSideRevenueUSD = constants.BIGDECIMAL_ZERO;
    vault.cumulativeTotalRevenueUSD = constants.BIGDECIMAL_ZERO;

    const withdrawlFeeId =
      utils.enumToPrefix(constants.VaultFeeType.WITHDRAWAL_FEE) +
      vaultAddress.toHexString();

    getOrCreateFee(withdrawlFeeId, constants.VaultFeeType.WITHDRAWAL_FEE);

    const performanceFeeId =
      utils.enumToPrefix(constants.VaultFeeType.PERFORMANCE_FEE) +
      vaultAddress.toHexString();

    getOrCreateFee(performanceFeeId, constants.VaultFeeType.PERFORMANCE_FEE);

    const managementFeeId =
      utils.enumToPrefix(constants.VaultFeeType.MANAGEMENT_FEE) +
      vaultAddress.toHexString();

    getOrCreateFee(managementFeeId, constants.VaultFeeType.MANAGEMENT_FEE);

    vault.fees = [withdrawlFeeId, performanceFeeId, managementFeeId];
    utils.updateProtocolAfterNewVault(vaultAddress);

    vault.save();
  }

  return vault;
}

export function getOrCreateAuction(
  auctionId: BigInt,
  vaultAddress: Address = constants.NULL.TYPE_ADDRESS,
  optionToken: Address = constants.NULL.TYPE_ADDRESS,
  biddingToken: Address = constants.NULL.TYPE_ADDRESS
): _Auction {
  let auction = _Auction.load(auctionId.toString());
  if (!auction) {
    auction = new _Auction(auctionId.toString());
    auction.optionToken = optionToken.toHexString();
    auction.biddingToken = biddingToken.toHexString();
    auction.vault = vaultAddress.toHexString();
    auction.save();
  }

  return auction;
}

export function getOrCreateSwap(
  swapId: string,
  vaultAddress: Address = constants.NULL.TYPE_ADDRESS,
  optionToken: Address = constants.NULL.TYPE_ADDRESS,
  biddingToken: Address = constants.NULL.TYPE_ADDRESS
): _SwapOffer {
  let swapOffer = _SwapOffer.load(swapId.toString());
  if (!swapOffer) {
    swapOffer = new _SwapOffer(swapId.toString());
    swapOffer.optionToken = optionToken.toHexString();
    swapOffer.biddingToken = biddingToken.toHexString();
    swapOffer.vault = vaultAddress.toHexString();
    swapOffer.save();
  }

  return swapOffer;
}

export function getOrCreateAccount(id: string): Account {
  let account = Account.load(id);

  if (!account) {
    account = new Account(id);
    account.save();

    const protocol = getOrCreateYieldAggregator();
    protocol.cumulativeUniqueUsers += 1;
    protocol.save();
  }

  return account;
}

export function getOrCreateLiquidityGauge(
  gaugeAddress: Address
): _LiquidityGauge {
  let gauge = _LiquidityGauge.load(gaugeAddress.toHexString());
  if (!gauge) {
    gauge = new _LiquidityGauge(gaugeAddress.toHexString());
    const gaugeContract = GaugeContract.bind(gaugeAddress);
    gauge.name = utils.readValue(gaugeContract.try_name(), "");
    gauge.decimals = utils.readValue(
      gaugeContract.try_decimals(),
      constants.BIGINT_ZERO
    );
    let vaultAddress = utils.readValue(
      gaugeContract.try_lp_token(),
      constants.NULL.TYPE_ADDRESS
    );

    if (vaultAddress.equals(constants.NULL.TYPE_ADDRESS)) {
      vaultAddress = utils.readValue(
        gaugeContract.try_stakingToken(),
        constants.NULL.TYPE_ADDRESS
      );
    }

    gauge.vault = vaultAddress.toHexString();
    gauge.symbol = utils.readValue(gaugeContract.try_symbol(), "");
    gauge.save();
    LiquidityGaugeTemplate.create(gaugeAddress);
  }
  return gauge;
}

export function getOrCreateVaultsHourlySnapshots(
  vaultId: string,
  block: ethereum.Block
): VaultHourlySnapshot {
  const id: string = vaultId
    .concat("-")
    .concat((block.timestamp.toI64() / constants.SECONDS_PER_HOUR).toString());
  let vaultSnapshots = VaultHourlySnapshot.load(id);

  if (!vaultSnapshots) {
    vaultSnapshots = new VaultHourlySnapshot(id);
    vaultSnapshots.protocol = constants.PROTOCOL_ID;
    vaultSnapshots.vault = vaultId;

    vaultSnapshots.totalValueLockedUSD = constants.BIGDECIMAL_ZERO;
    vaultSnapshots.inputTokenBalance = constants.BIGINT_ZERO;
    vaultSnapshots.outputTokenSupply = constants.BIGINT_ZERO;
    vaultSnapshots.outputTokenPriceUSD = constants.BIGDECIMAL_ZERO;
    vaultSnapshots.pricePerShare = constants.BIGDECIMAL_ZERO;

    vaultSnapshots.hourlySupplySideRevenueUSD = constants.BIGDECIMAL_ZERO;
    vaultSnapshots.cumulativeSupplySideRevenueUSD = constants.BIGDECIMAL_ZERO;

    vaultSnapshots.hourlyProtocolSideRevenueUSD = constants.BIGDECIMAL_ZERO;
    vaultSnapshots.cumulativeProtocolSideRevenueUSD = constants.BIGDECIMAL_ZERO;

    vaultSnapshots.hourlyTotalRevenueUSD = constants.BIGDECIMAL_ZERO;
    vaultSnapshots.cumulativeTotalRevenueUSD = constants.BIGDECIMAL_ZERO;

    vaultSnapshots.rewardTokenEmissionsAmount = [];
    vaultSnapshots.rewardTokenEmissionsUSD = [];

    vaultSnapshots.blockNumber = block.number;
    vaultSnapshots.timestamp = block.timestamp;

    vaultSnapshots.save();
  }

  return vaultSnapshots;
}

export function getOrCreateVaultsDailySnapshots(
  vaultId: string,
  block: ethereum.Block
): VaultDailySnapshot {
  const id: string = vaultId
    .concat("-")
    .concat((block.timestamp.toI64() / constants.SECONDS_PER_DAY).toString());
  let vaultSnapshots = VaultDailySnapshot.load(id);

  if (!vaultSnapshots) {
    vaultSnapshots = new VaultDailySnapshot(id);
    vaultSnapshots.protocol = constants.PROTOCOL_ID;
    vaultSnapshots.vault = vaultId;

    vaultSnapshots.totalValueLockedUSD = constants.BIGDECIMAL_ZERO;
    vaultSnapshots.inputTokenBalance = constants.BIGINT_ZERO;
    vaultSnapshots.outputTokenSupply = constants.BIGINT_ZERO;
    vaultSnapshots.outputTokenPriceUSD = constants.BIGDECIMAL_ZERO;
    vaultSnapshots.pricePerShare = constants.BIGDECIMAL_ZERO;

    vaultSnapshots.dailySupplySideRevenueUSD = constants.BIGDECIMAL_ZERO;
    vaultSnapshots.cumulativeSupplySideRevenueUSD = constants.BIGDECIMAL_ZERO;

    vaultSnapshots.dailyProtocolSideRevenueUSD = constants.BIGDECIMAL_ZERO;
    vaultSnapshots.cumulativeProtocolSideRevenueUSD = constants.BIGDECIMAL_ZERO;

    vaultSnapshots.dailyTotalRevenueUSD = constants.BIGDECIMAL_ZERO;
    vaultSnapshots.cumulativeTotalRevenueUSD = constants.BIGDECIMAL_ZERO;

    vaultSnapshots.blockNumber = block.number;
    vaultSnapshots.timestamp = block.timestamp;

    vaultSnapshots.rewardTokenEmissionsAmount = [];
    vaultSnapshots.rewardTokenEmissionsUSD = [];

    vaultSnapshots.save();
  }

  return vaultSnapshots;
}
