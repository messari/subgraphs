import {
  Address,
  BigDecimal,
  dataSource,
  ethereum,
  log,
} from "@graphprotocol/graph-ts";
import {
  FinancialsDailySnapshot,
  Token,
  Vault,
  VaultDailySnapshot,
  VaultFee,
  VaultHourlySnapshot,
  YieldAggregator,
} from "../../generated/schema";
import { BeefyStrategy } from "../../generated/Standard/BeefyStrategy";
import {
  fetchTokenDecimals,
  fetchTokenName,
  fetchTokenSymbol,
} from "../mappings/token";
import { BIGDECIMAL_ZERO, BIGINT_ZERO } from "../prices/common/constants";
import { getUsdPricePerToken } from "../prices";
import {
  BIGDECIMAL_HUNDRED,
  ProtocolType,
  PROTOCOL_ID,
  PROTOCOL_METHODOLOGY_VERSION,
  PROTOCOL_NAME,
  PROTOCOL_SCHEMA_VERSION,
  PROTOCOL_SLUG,
  PROTOCOL_SUBGRAPH_VERSION,
  SECONDS_PER_DAY,
  VaultFeeType,
} from "./constants";
import { BeefyVault } from "../../generated/Standard/BeefyVault";
import { getDaysSinceEpoch, getHoursSinceEpoch } from "./time";

// also updates price of token
export function getOrCreateToken(
  tokenAddress: Address,
  block: ethereum.Block,
  isOutputToken: boolean = false
): Token {
  const tokenId = tokenAddress.toHexString();
  let token = Token.load(tokenId);
  if (!token) {
    token = new Token(tokenId);
    token.name = fetchTokenName(tokenAddress);
    token.symbol = fetchTokenSymbol(tokenAddress);
    token.decimals = fetchTokenDecimals(tokenAddress);
  }

  if (!isOutputToken) {
    const price = getUsdPricePerToken(tokenAddress);
    if (price.reverted) {
      token.lastPriceUSD = BIGDECIMAL_ZERO;
    } else {
      token.lastPriceUSD = price.usdPrice.div(price.decimalsBaseTen);
    }
    token.lastPriceBlockNumber = block.number;
  }
  token.save();
  return token;
}

export function getOrCreateVault(
  strategyAddress: Address,
  event: ethereum.Event
): Vault | null {
  const strategyContract = BeefyStrategy.bind(strategyAddress);
  const vaultId = strategyContract.vault().toHexString();
  let vault = Vault.load(vaultId);
  if (!vault) {
    const strategyContract = BeefyStrategy.bind(strategyAddress);
    const tryVaultAddress = strategyContract.try_vault();
    if (tryVaultAddress.reverted) {
      log.warning("Failed to get vault address from strategy {}", [
        strategyAddress.toHexString(),
      ]);
      return null;
    }
    const vaultContract = BeefyVault.bind(tryVaultAddress.value);

    // create native token
    const tryNativeToken = strategyContract.try_native();
    if (tryNativeToken.reverted) {
      log.warning("Failed to get native token from strategy {}", [
        strategyAddress.toHexString(),
      ]);
      return null;
    }
    const nativeToken = getOrCreateToken(tryNativeToken.value, event.block);

    // create input token
    const tryInputToken = vaultContract.try_want();
    if (tryInputToken.reverted) {
      log.warning("Failed to get input token from vault {}", [
        tryVaultAddress.value.toHexString(),
      ]);
      return null;
    }
    const inputToken = getOrCreateToken(tryInputToken.value, event.block);

    // create output token
    const outputToken = getOrCreateToken(
      tryVaultAddress.value,
      event.block,
      true
    );

    // add vault to yield aggregator
    const yieldAggregator = getOrCreateYieldAggregator();
    let vaults = yieldAggregator._vaults;
    vaults.push(tryVaultAddress.value.toHexString());
    yieldAggregator._vaults = vaults;
    yieldAggregator.save();

    // create vault entity
    const vault = new Vault(tryVaultAddress.value.toHex());
    vault.protocol = yieldAggregator.id;
    vault.name = outputToken.name;
    vault.symbol = outputToken.symbol;
    vault.inputToken = inputToken.id;
    vault.outputToken = outputToken.id;
    vault.fees = getFees(vault.id, strategyContract);
    vault.createdTimestamp = event.block.timestamp;
    vault.createdBlockNumber = event.block.number;
    vault.totalValueLockedUSD = BIGDECIMAL_ZERO;
    vault.inputTokenBalance = BIGINT_ZERO;
    vault.outputTokenSupply = BIGINT_ZERO;
    vault.outputTokenPriceUSD = BIGDECIMAL_ZERO;
    vault.pricePerShare = BIGINT_ZERO;
    vault._strategyAddress = strategyAddress.toHexString();
    vault._nativeToken = nativeToken.id;

    // create strategy output token
    const tryStratOutput = strategyContract.try_output();
    if (!tryStratOutput.reverted) {
      vault._strategyOutputToken = getOrCreateToken(
        tryStratOutput.value,
        event.block
      ).id;
    }

    vault.save();
  }

  return vault;
}

// helper function to get the vault fees
export function getFees(
  vaultId: string,
  strategyContract: BeefyStrategy
): string[] {
  let fees: string[] = [];

  // Always a 4.5% performance fee (calculated on harvest)
  // this way we know performance fee is always in position 0
  const perfFee = new VaultFee(VaultFeeType.PERFORMANCE_FEE + "-" + vaultId);
  perfFee.feePercentage = BigDecimal.fromString("4.5");
  perfFee.feeType = VaultFeeType.PERFORMANCE_FEE;
  perfFee.save();
  fees.push(perfFee.id);

  // check for withdrawal fee
  // withdrawal fee = withdrawalFee() / WITHDRAWAL_MAX() * 100
  const tryWithdrawalFee = strategyContract.try_withdrawalFee();
  if (!tryWithdrawalFee.reverted) {
    const withdrawalFee = new VaultFee(
      VaultFeeType.WITHDRAWAL_FEE + "-" + vaultId
    );
    const withdrawalMax = strategyContract.try_WITHDRAWAL_MAX();
    if (!withdrawalMax.reverted) {
      withdrawalFee.feePercentage = tryWithdrawalFee.value
        .toBigDecimal()
        .div(withdrawalMax.value.toBigDecimal())
        .times(BIGDECIMAL_HUNDRED);
    } else {
      withdrawalFee.feePercentage = BIGDECIMAL_ZERO;
    }
    withdrawalFee.feeType = VaultFeeType.WITHDRAWAL_FEE;
    withdrawalFee.save();
    fees.push(withdrawalFee.id);
  }

  return fees;
}

export function getOrCreateYieldAggregator(): YieldAggregator {
  let yieldAggregator = YieldAggregator.load(PROTOCOL_ID);

  if (!yieldAggregator) {
    yieldAggregator = new YieldAggregator(PROTOCOL_ID);
    yieldAggregator.name = PROTOCOL_NAME;
    yieldAggregator.slug = PROTOCOL_SLUG;
    yieldAggregator.schemaVersion = PROTOCOL_SCHEMA_VERSION;
    yieldAggregator.subgraphVersion = PROTOCOL_SUBGRAPH_VERSION;
    yieldAggregator.methodologyVersion = PROTOCOL_METHODOLOGY_VERSION;
    yieldAggregator.network = dataSource
      .network()
      .toUpperCase()
      .replace("-", "_");
    yieldAggregator.type = ProtocolType.YIELD;
    yieldAggregator.totalValueLockedUSD = BIGDECIMAL_ZERO;
    yieldAggregator.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
    yieldAggregator.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    yieldAggregator.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;
    yieldAggregator.cumulativeUniqueUsers = BIGINT_ZERO;
    yieldAggregator._vaults = [];
    yieldAggregator.save();
  }

  return yieldAggregator;
}

export function getOrCreateFinancials(
  event: ethereum.Event
): FinancialsDailySnapshot {
  // Number of days since Unix epoch
  const id: i64 = event.block.timestamp.toI64() / SECONDS_PER_DAY;
  const protocol = getOrCreateYieldAggregator();
  let financialMetrics = FinancialsDailySnapshot.load(id.toString());

  if (!financialMetrics) {
    financialMetrics = new FinancialsDailySnapshot(id.toString());
    financialMetrics.protocol = PROTOCOL_ID;
    financialMetrics.totalValueLockedUSD = BIGDECIMAL_ZERO;
    financialMetrics.dailySupplySideRevenueUSD = BIGDECIMAL_ZERO;
    financialMetrics.cumulativeSupplySideRevenueUSD =
      protocol.cumulativeSupplySideRevenueUSD;
    financialMetrics.dailyProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    financialMetrics.cumulativeProtocolSideRevenueUSD =
      protocol.cumulativeProtocolSideRevenueUSD;
    financialMetrics.dailyTotalRevenueUSD = BIGDECIMAL_ZERO;
    financialMetrics.cumulativeTotalRevenueUSD =
      protocol.cumulativeTotalRevenueUSD;
  }

  financialMetrics.blockNumber = event.block.number;
  financialMetrics.timestamp = event.block.timestamp;
  financialMetrics.save();

  return financialMetrics;
}

export function getOrCreateVaultDailySnapshot(
  vaultId: string,
  event: ethereum.Event
): VaultDailySnapshot {
  const id = getVaultDailyId(event.block, vaultId);

  let vaultDailySnapshot = VaultDailySnapshot.load(id);
  if (!vaultDailySnapshot) {
    vaultDailySnapshot = new VaultDailySnapshot(id);
    vaultDailySnapshot.protocol = PROTOCOL_ID;
    vaultDailySnapshot.vault = vaultId;
    vaultDailySnapshot.totalValueLockedUSD = BIGDECIMAL_ZERO;
    vaultDailySnapshot.inputTokenBalance = BIGINT_ZERO;
    vaultDailySnapshot.outputTokenSupply = BIGINT_ZERO;
    vaultDailySnapshot.outputTokenPriceUSD = BIGDECIMAL_ZERO;
    vaultDailySnapshot.pricePerShare = BIGINT_ZERO;
    vaultDailySnapshot.dailyTotalRevenueUSD = BIGDECIMAL_ZERO;
  }

  vaultDailySnapshot.blockNumber = event.block.number;
  vaultDailySnapshot.timestamp = event.block.timestamp;
  vaultDailySnapshot.save();

  return vaultDailySnapshot;
}

export function getOrCreateVaultHourlySnapshot(
  vaultId: string,
  event: ethereum.Event
): VaultHourlySnapshot {
  const id = getVaultHourlyId(event.block, vaultId);

  let vaultHourlySnapshot = VaultHourlySnapshot.load(id);
  if (!vaultHourlySnapshot) {
    vaultHourlySnapshot = new VaultHourlySnapshot(id);
    vaultHourlySnapshot.protocol = PROTOCOL_ID;
    vaultHourlySnapshot.vault = vaultId;
    vaultHourlySnapshot.totalValueLockedUSD = BIGDECIMAL_ZERO;
    vaultHourlySnapshot.inputTokenBalance = BIGINT_ZERO;
    vaultHourlySnapshot.outputTokenSupply = BIGINT_ZERO;
    vaultHourlySnapshot.outputTokenPriceUSD = BIGDECIMAL_ZERO;
    vaultHourlySnapshot.pricePerShare = BIGINT_ZERO;
  }

  vaultHourlySnapshot.blockNumber = event.block.number;
  vaultHourlySnapshot.timestamp = event.block.timestamp;
  vaultHourlySnapshot.save();

  return vaultHourlySnapshot;
}

/////////////////
//// Helpers ////
/////////////////

export function getVaultDailyId(
  block: ethereum.Block,
  vaultId: string
): string {
  const daysSinceEpoch = getDaysSinceEpoch(block.timestamp.toI32()).toString();
  const id = vaultId.concat("-").concat(daysSinceEpoch);
  return id;
}

export function getVaultHourlyId(
  block: ethereum.Block,
  vaultId: string
): string {
  const hoursSinceEpoch = getHoursSinceEpoch(
    block.timestamp.toI32()
  ).toString();
  const id = vaultId.concat("-").concat(hoursSinceEpoch);
  return id;
}
