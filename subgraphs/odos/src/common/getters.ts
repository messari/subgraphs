import { Address, BigDecimal, BigInt, ethereum } from "@graphprotocol/graph-ts";
import * as constants from "./constants";
import * as utils from "./utils";
import {
  DexAmmProtocol,
  FinancialsDailySnapshot,
  RewardToken,
  Token,
  UsageMetricsDailySnapshot,
  UsageMetricsHourlySnapshot,
  _TokenDailySnapshot,
  _MultiToken,
  _MultiTokenDailySnapshot,
} from "../../generated/schema";
import { ERC20 } from "../../generated/OdosRouter/ERC20";
import { getUsdPricePerToken } from "../prices/index";
import { NetworkConfigs } from "../../configurations/configure";

export function getOrCreateProtocol(): DexAmmProtocol {
  let protocol = DexAmmProtocol.load(NetworkConfigs.getFactoryAddress());

  if (!protocol) {
    protocol = new DexAmmProtocol(NetworkConfigs.getFactoryAddress());
    protocol.name = NetworkConfigs.getProtocolName();
    protocol.slug = NetworkConfigs.getProtocolSlug();
    protocol.totalValueLockedUSD = constants.BIGDECIMAL_ZERO;
    protocol.cumulativeVolumeUSD = constants.BIGDECIMAL_ZERO;
    protocol.cumulativeSupplySideRevenueUSD = constants.BIGDECIMAL_ZERO;
    protocol.cumulativeProtocolSideRevenueUSD = constants.BIGDECIMAL_ZERO;
    protocol.cumulativeTotalRevenueUSD = constants.BIGDECIMAL_ZERO;
    protocol.cumulativeUniqueUsers = constants.INT_ZERO;
    protocol.network = NetworkConfigs.getNetwork();
    protocol.type = constants.ProtocolType.EXCHANGE;
    protocol.totalPoolCount = constants.INT_ZERO;

    protocol.schemaVersion = "1.0.0";
    protocol.subgraphVersion = "1.0.0";
    protocol.methodologyVersion = "1.0.0";

    protocol.save();
  }

  // protocol.schemaVersion = Versions.getSchemaVersion();
  // protocol.subgraphVersion = Versions.getSubgraphVersion();
  // protocol.methodologyVersion = Versions.getMethodologyVersion();

  protocol.schemaVersion = "1.0.0";
  protocol.subgraphVersion = "1.0.0";
  protocol.methodologyVersion = "1.0.0";

  protocol.save();

  return protocol;
}

export function getOrCreateUsageMetricDailySnapshot(
  event: ethereum.Event
): UsageMetricsDailySnapshot {
  // Number of days since Unix epoch
  const id = event.block.timestamp.toI32() / constants.SECONDS_PER_DAY;
  const dayId = id.toString();
  // Create unique id for the day
  let usageMetrics = UsageMetricsDailySnapshot.load(dayId);

  if (!usageMetrics) {
    const protocol = getOrCreateProtocol();

    usageMetrics = new UsageMetricsDailySnapshot(dayId);
    usageMetrics.protocol = protocol.id;

    usageMetrics.dailyActiveUsers = constants.INT_ZERO;
    usageMetrics.cumulativeUniqueUsers = constants.INT_ZERO;
    usageMetrics.dailyTransactionCount = constants.INT_ZERO;
    usageMetrics.dailyDepositCount = constants.INT_ZERO;
    usageMetrics.dailyWithdrawCount = constants.INT_ZERO;
    usageMetrics.dailySwapCount = constants.INT_ZERO;
    usageMetrics.totalPoolCount = protocol.totalPoolCount;

    usageMetrics.blockNumber = event.block.number;
    usageMetrics.timestamp = event.block.timestamp;

    usageMetrics.save();
  }

  return usageMetrics;
}

export function getOrCreateUsageMetricHourlySnapshot(
  event: ethereum.Event
): UsageMetricsHourlySnapshot {
  // Number of days since Unix epoch
  const hour = event.block.timestamp.toI32() / constants.SECONDS_PER_HOUR;
  const hourId = hour.toString();

  // Create unique id for the day
  let usageMetrics = UsageMetricsHourlySnapshot.load(hourId);

  if (!usageMetrics) {
    const protocol = getOrCreateProtocol();

    usageMetrics = new UsageMetricsHourlySnapshot(hourId);
    usageMetrics.protocol = protocol.id;

    usageMetrics.hourlyActiveUsers = constants.INT_ZERO;
    usageMetrics.cumulativeUniqueUsers = constants.INT_ZERO;
    usageMetrics.hourlyTransactionCount = constants.INT_ZERO;
    usageMetrics.hourlyDepositCount = constants.INT_ZERO;
    usageMetrics.hourlyWithdrawCount = constants.INT_ZERO;
    usageMetrics.hourlySwapCount = constants.INT_ZERO;

    usageMetrics.blockNumber = event.block.number;
    usageMetrics.timestamp = event.block.timestamp;

    usageMetrics.save();
  }

  return usageMetrics;
}

export function getOrCreateFinancialsDailySnapshot(
  event: ethereum.Event
): FinancialsDailySnapshot {
  // Number of days since Unix epoch
  const dayID = event.block.timestamp.toI32() / constants.SECONDS_PER_DAY;
  const id = dayID.toString();

  let financialMetrics = FinancialsDailySnapshot.load(id);

  if (!financialMetrics) {
    const protocol = getOrCreateProtocol();

    financialMetrics = new FinancialsDailySnapshot(id);
    financialMetrics.protocol = protocol.id;

    financialMetrics.totalValueLockedUSD = constants.BIGDECIMAL_ZERO;
    // Needed?
    financialMetrics.protocolControlledValueUSD = constants.BIGDECIMAL_ZERO;
    financialMetrics.dailySupplySideRevenueUSD = constants.BIGDECIMAL_ZERO;
    financialMetrics.cumulativeSupplySideRevenueUSD = constants.BIGDECIMAL_ZERO;
    financialMetrics.dailyProtocolSideRevenueUSD = constants.BIGDECIMAL_ZERO;
    financialMetrics.cumulativeProtocolSideRevenueUSD =
      constants.BIGDECIMAL_ZERO;
    financialMetrics.dailyTotalRevenueUSD = constants.BIGDECIMAL_ZERO;
    financialMetrics.cumulativeTotalRevenueUSD = constants.BIGDECIMAL_ZERO;

    financialMetrics.dailyVolumeUSD = constants.BIGDECIMAL_ZERO;
    financialMetrics.cumulativeVolumeUSD = constants.BIGDECIMAL_ZERO;

    financialMetrics.blockNumber = event.block.number;
    financialMetrics.timestamp = event.block.timestamp;

    financialMetrics.save();
  }
  return financialMetrics;
}

export function getOrCreateToken(
  event: ethereum.Event,
  address: string
): Token {
  let token = Token.load(address);
  if (!token) {
    token = new Token(address);
    const erc20Contract = ERC20.bind(Address.fromString(address));

    token.name = utils.readValue<string>(erc20Contract.try_name(), "");
    token.symbol = utils.readValue<string>(erc20Contract.try_symbol(), "");
    token.decimals = utils
      .readValue<BigInt>(
        erc20Contract.try_decimals(),
        constants.DEFAULT_DECIMALS_BIGINT
      )
      .toI32();

    const tokenPrice = getUsdPricePerToken(Address.fromString(address));
    token.lastPriceUSD = tokenPrice.usdPrice.div(tokenPrice.decimalsBaseTen);
    token.lastPriceBlockNumber = event.block.number;

    token._cumulativeVolume = constants.BIGINT_ZERO;
    token._cumulativeVolumeUSD = constants.BIGDECIMAL_ZERO;

    token.save();
  }

  if (!token.lastPriceUSD || !token.lastPriceBlockNumber) {
    const tokenPrice = getUsdPricePerToken(Address.fromString(address));
    token.lastPriceUSD = tokenPrice.usdPrice.div(tokenPrice.decimalsBaseTen);
    token.lastPriceBlockNumber = event.block.number;

    token.save();
  }
  return token as Token;
}

export function getOrCreateRewardToken(
  event: ethereum.Event,
  address: string,
  RewardTokenType: string
): RewardToken {
  let rewardToken = RewardToken.load(address);
  if (rewardToken == null) {
    const token = getOrCreateToken(event, address);
    rewardToken = new RewardToken(RewardTokenType + "-" + address);
    rewardToken.token = token.id;
    rewardToken.type = RewardTokenType;
    rewardToken.save();
  }
  return rewardToken as RewardToken;
}

export function getOrCreateTokenDailySnapshot(
  event: ethereum.Event,
  token: Token
): _TokenDailySnapshot {
  const day = event.block.timestamp.toI32() / constants.SECONDS_PER_DAY;
  const dayId = day.toString();
  let tokenMetrics = _TokenDailySnapshot.load(
    token.id.concat("-").concat(dayId)
  );

  if (!tokenMetrics) {
    tokenMetrics = new _TokenDailySnapshot(token.id.concat("-").concat(dayId));
    tokenMetrics.token = token.id;
    tokenMetrics.priceUSD = token.lastPriceUSD;
    tokenMetrics.dailyVolume = constants.BIGINT_ZERO;
    tokenMetrics.dailyVolumeUSD = constants.BIGDECIMAL_ZERO;
    tokenMetrics.cumulativeVolume = constants.BIGINT_ZERO;
    tokenMetrics.cumulativeVolumeUSD = constants.BIGDECIMAL_ZERO;

    tokenMetrics.blockNumber = event.block.number;
    tokenMetrics.timestamp = event.block.timestamp;

    tokenMetrics.save();
  }

  return tokenMetrics;
}

export function getOrCreateMultiToken(
  event: ethereum.Event,
  inputTokens: Token[],
  outputTokens: Token[]
): _MultiToken {
  let multiTokenID: string = "";
  multiTokenID = multiTokenID.concat("InputTokens-");
  for (let i = 0; i < inputTokens.length; i++) {
    multiTokenID = `${multiTokenID}${inputTokens[i].id}-`;
  }

  multiTokenID = multiTokenID.concat("OutputTokens-");
  for (let i = 0; i < outputTokens.length; i++) {
    // if last iteration
    if (i == outputTokens.length - 1) {
      multiTokenID = `${multiTokenID}${outputTokens[i].id}`;
    } else {
      multiTokenID = `${multiTokenID}${outputTokens[i].id}-`;
    }
  }

  let multiToken = _MultiToken.load(multiTokenID);
  if (!multiToken) {
    multiToken = new _MultiToken(multiTokenID);
    multiToken.timestamp = event.block.timestamp;
    multiToken.blockNumber = event.block.number;
    multiToken.tokensIn = utils.getTokenIds(inputTokens);
    multiToken.tokensOut = utils.getTokenIds(outputTokens);

    multiToken.cumulativeInVolumes = new Array<BigInt>(inputTokens.length).fill(
      constants.BIGINT_ZERO
    );
    multiToken.cumulativeInVolumesUSD = new Array<BigDecimal>(
      inputTokens.length
    ).fill(constants.BIGDECIMAL_ZERO);

    multiToken.cumulativeOutVolumes = new Array<BigInt>(
      outputTokens.length
    ).fill(constants.BIGINT_ZERO);
    multiToken.cumulativeOutVolumesUSD = new Array<BigDecimal>(
      outputTokens.length
    ).fill(constants.BIGDECIMAL_ZERO);

    multiToken.cumulativeVolumeUSD = constants.BIGDECIMAL_ZERO;

    multiToken.save();
  }

  return multiToken;
}

// Multi token daily snapshot
export function getOrCreateMultiTokenDailySnapshot(
  event: ethereum.Event,
  multiToken: _MultiToken
): _MultiTokenDailySnapshot {
  const day = event.block.timestamp.toI32() / constants.SECONDS_PER_DAY;
  const dayId = day.toString();
  const multiTokenId = multiToken.id;
  const multiTokenDailySnapshotId = multiTokenId.concat("-").concat(dayId);
  let multiTokenDailySnapshot = _MultiTokenDailySnapshot.load(
    multiTokenDailySnapshotId
  );
  if (!multiTokenDailySnapshot) {
    multiTokenDailySnapshot = new _MultiTokenDailySnapshot(
      multiTokenDailySnapshotId
    );
    multiTokenDailySnapshot.multiToken = multiTokenId;
    multiTokenDailySnapshot.timestamp = event.block.timestamp;
    multiTokenDailySnapshot.blockNumber = event.block.number;

    multiTokenDailySnapshot.dailyInVolumes = new Array<BigInt>(
      multiToken.tokensIn.length
    ).fill(constants.BIGINT_ZERO);
    multiTokenDailySnapshot.cumulativeInVolumes = new Array<BigInt>(
      multiToken.tokensIn.length
    ).fill(constants.BIGINT_ZERO);
    multiTokenDailySnapshot.dailyInVolumesUSD = new Array<BigDecimal>(
      multiToken.tokensIn.length
    ).fill(constants.BIGDECIMAL_ZERO);
    multiTokenDailySnapshot.cumulativeInVolumesUSD = new Array<BigDecimal>(
      multiToken.tokensIn.length
    ).fill(constants.BIGDECIMAL_ZERO);

    multiTokenDailySnapshot.dailyOutVolumes = new Array<BigInt>(
      multiToken.tokensOut.length
    ).fill(constants.BIGINT_ZERO);
    multiTokenDailySnapshot.cumulativeOutVolumes = new Array<BigInt>(
      multiToken.tokensOut.length
    ).fill(constants.BIGINT_ZERO);
    multiTokenDailySnapshot.dailyOutVolumesUSD = new Array<BigDecimal>(
      multiToken.tokensOut.length
    ).fill(constants.BIGDECIMAL_ZERO);
    multiTokenDailySnapshot.cumulativeOutVolumesUSD = new Array<BigDecimal>(
      multiToken.tokensOut.length
    ).fill(constants.BIGDECIMAL_ZERO);

    multiTokenDailySnapshot.dailyVolumeUSD = constants.BIGDECIMAL_ZERO;
    multiTokenDailySnapshot.cumulativeVolumeUSD = constants.BIGDECIMAL_ZERO;

    multiTokenDailySnapshot.save();
  }
  return multiTokenDailySnapshot as _MultiTokenDailySnapshot;
}

// Sort a list of strings
export function sortTokens(tokens: Token[]): Token[] {
  return tokens.sort((a, b) => {
    return a.id.localeCompare(b.id);
  });
}
