import { Address, dataSource, ethereum } from "@graphprotocol/graph-ts";
import { FeesEarned } from "../../../generated/templates/ArrakisVault/ArrakisVaultV1";
import {
  getOrCreateVault,
  getUnderlyingTokenBalances,
  updateVaultSnapshots,
} from "./vaults";
import {
  BIGDECIMAL_HUNDRED,
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  PROTOCOL_PERFORMANCE_FEE,
  REGISTRY_ADDRESS_MAP,
} from "../../common/constants";
import {
  getOrCreateFinancialsDailySnapshot,
  getOrCreateToken,
  getOrCreateVaultDailySnapshot,
  getOrCreateVaultHourlySnapshot,
  getOrCreateYieldAggregator,
} from "../../common/getters";
import { getDualTokenUSD, getTokenValueUSD } from "./pricing";
import { bigIntToBigDecimal } from "../../common/utils/numbers";
import { Vault } from "../../../generated/schema";

// Update TVL related fields in all entities
export function updateTvl(event: ethereum.Event): void {
  // Update entities
  const protocol = getOrCreateYieldAggregator(
    REGISTRY_ADDRESS_MAP.get(dataSource.network())!
  );

  let protocolTvlUSD = BIGDECIMAL_ZERO;
  const vaultIDs = protocol._vaultIDs ? protocol._vaultIDs! : [];
  for (let i = 0; i < vaultIDs.length; i++) {
    const _vault = updateVaultTokenValue(
      Address.fromString(vaultIDs[i]),
      event
    );
    protocolTvlUSD = protocolTvlUSD.plus(_vault.totalValueLockedUSD);
  }

  protocol.totalValueLockedUSD = protocolTvlUSD;
  const financialsDailySnapshot = getOrCreateFinancialsDailySnapshot(event);
  financialsDailySnapshot.totalValueLockedUSD = protocol.totalValueLockedUSD;
  financialsDailySnapshot.blockNumber = event.block.number;
  financialsDailySnapshot.timestamp = event.block.timestamp;

  protocol.save();
  financialsDailySnapshot.save();
}

function updateVaultTokenValue(
  vaultAddress: Address,
  event: ethereum.Event,
  updateUnderlyingBalances: boolean = true
): Vault {
  const block = event.block;
  const vault = getOrCreateVault(vaultAddress, block);
  if (updateUnderlyingBalances) {
    const tokenBalances = getUnderlyingTokenBalances(vaultAddress, event);
    if (tokenBalances && tokenBalances.length == 2) {
      vault._token0Amount = tokenBalances[0];
      vault._token1Amount = tokenBalances[1];
    }
  }

  const token0AmountUSD = getTokenValueUSD(
    Address.fromString(vault._token0),
    vault._token0Amount,
    block
  );
  const token1AmountUSD = getTokenValueUSD(
    Address.fromString(vault._token1),
    vault._token1Amount,
    block
  );

  const newTvl = token0AmountUSD.plus(token1AmountUSD);
  // Calculate price per share
  const outputToken = getOrCreateToken(Address.fromString(vault.outputToken!));
  const vaultTokenSupply = vault.outputTokenSupply!;
  let outputTokenPriceUSD = vault.outputTokenPriceUSD;
  if (vaultTokenSupply > BIGINT_ZERO) {
    const outputTokenSupplyDecimals = bigIntToBigDecimal(
      vaultTokenSupply,
      outputToken.decimals
    );
    outputTokenPriceUSD = newTvl.div(outputTokenSupplyDecimals);
  }

  vault.totalValueLockedUSD = newTvl;
  vault.outputTokenPriceUSD = outputTokenPriceUSD;
  vault._token0AmountUSD = token0AmountUSD;
  vault._token1AmountUSD = token1AmountUSD;
  vault.save();

  updateVaultSnapshots(vault, block);

  return vault;
}

// Update revenue related fields, Only changes when rebalance is called.
export function updateRevenue(event: FeesEarned): void {
  const vault = getOrCreateVault(event.address, event.block);

  // Calculate revenue in USD
  const eventTotalRevenueUSD = getDualTokenUSD(
    Address.fromString(vault._token0),
    Address.fromString(vault._token1),
    event.params.feesEarned0,
    event.params.feesEarned1,
    event.block
  );

  const SupplySideShare = BIGDECIMAL_HUNDRED.minus(PROTOCOL_PERFORMANCE_FEE);

  const eventSupplySideRevenueUSD = eventTotalRevenueUSD
    .times(SupplySideShare)
    .div(BIGDECIMAL_HUNDRED);

  const eventProtocolSideRevenueUSD = eventTotalRevenueUSD
    .times(PROTOCOL_PERFORMANCE_FEE)
    .div(BIGDECIMAL_HUNDRED);

  // Update entities
  const protocol = getOrCreateYieldAggregator(
    REGISTRY_ADDRESS_MAP.get(dataSource.network())!
  );

  const vaultDailySnapshot = getOrCreateVaultDailySnapshot(
    event.address,
    event.block
  );
  const vaultHourlySnapshot = getOrCreateVaultHourlySnapshot(
    event.address,
    event.block
  );
  const financialsDailySnapshot = getOrCreateFinancialsDailySnapshot(event);

  // Update protocol cumulative revenue
  protocol.cumulativeSupplySideRevenueUSD =
    protocol.cumulativeSupplySideRevenueUSD.plus(eventSupplySideRevenueUSD);
  protocol.cumulativeProtocolSideRevenueUSD =
    protocol.cumulativeProtocolSideRevenueUSD.plus(eventProtocolSideRevenueUSD);
  protocol.cumulativeTotalRevenueUSD =
    protocol.cumulativeTotalRevenueUSD.plus(eventTotalRevenueUSD);

  // Update vault cumulative revenue
  vault.cumulativeSupplySideRevenueUSD =
    vault.cumulativeSupplySideRevenueUSD.plus(eventSupplySideRevenueUSD);
  vault.cumulativeProtocolSideRevenueUSD =
    vault.cumulativeProtocolSideRevenueUSD.plus(eventProtocolSideRevenueUSD);
  vault.cumulativeTotalRevenueUSD =
    vault.cumulativeTotalRevenueUSD.plus(eventTotalRevenueUSD);

  // Increment snapshot revenues
  vaultDailySnapshot.dailySupplySideRevenueUSD =
    vaultDailySnapshot.dailySupplySideRevenueUSD.plus(
      eventSupplySideRevenueUSD
    );
  vaultDailySnapshot.dailyProtocolSideRevenueUSD =
    vaultDailySnapshot.dailyProtocolSideRevenueUSD.plus(
      eventProtocolSideRevenueUSD
    );
  vaultDailySnapshot.dailyTotalRevenueUSD =
    vaultDailySnapshot.dailyTotalRevenueUSD.plus(eventTotalRevenueUSD);

  vaultHourlySnapshot.hourlySupplySideRevenueUSD =
    vaultHourlySnapshot.hourlySupplySideRevenueUSD.plus(
      eventSupplySideRevenueUSD
    );
  vaultHourlySnapshot.hourlyProtocolSideRevenueUSD =
    vaultHourlySnapshot.hourlyProtocolSideRevenueUSD.plus(
      eventProtocolSideRevenueUSD
    );
  vaultHourlySnapshot.hourlyTotalRevenueUSD =
    vaultHourlySnapshot.hourlyTotalRevenueUSD.plus(eventTotalRevenueUSD);

  financialsDailySnapshot.dailySupplySideRevenueUSD =
    financialsDailySnapshot.dailySupplySideRevenueUSD.plus(
      eventSupplySideRevenueUSD
    );
  financialsDailySnapshot.dailyProtocolSideRevenueUSD =
    financialsDailySnapshot.dailyProtocolSideRevenueUSD.plus(
      eventProtocolSideRevenueUSD
    );
  financialsDailySnapshot.dailyTotalRevenueUSD =
    financialsDailySnapshot.dailyTotalRevenueUSD.plus(eventTotalRevenueUSD);

  // Update cumulative revenue from protocol
  financialsDailySnapshot.cumulativeSupplySideRevenueUSD =
    protocol.cumulativeSupplySideRevenueUSD;
  financialsDailySnapshot.cumulativeProtocolSideRevenueUSD =
    protocol.cumulativeProtocolSideRevenueUSD;
  financialsDailySnapshot.cumulativeTotalRevenueUSD =
    protocol.cumulativeTotalRevenueUSD;

  financialsDailySnapshot.blockNumber = event.block.number;
  financialsDailySnapshot.timestamp = event.block.timestamp;

  protocol.save();
  vault.save();
  vaultDailySnapshot.save();
  vaultHourlySnapshot.save();
  financialsDailySnapshot.save();
}
