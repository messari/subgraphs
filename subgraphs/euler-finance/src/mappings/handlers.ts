import { Address, ethereum } from "@graphprotocol/graph-ts";
import {
  AssetStatus,
  Borrow,
  Deposit,
  GovSetAssetConfig,
  Liquidation,
  MarketActivated,
  Repay,
  Withdraw,
} from "../../generated/euler/Euler";
import {
  EulerGeneralView,
  EulerGeneralView__doQueryInputQStruct,
  EulerGeneralView__doQueryResultRStruct,
} from "../../generated/euler/EulerGeneralView";
import { getOrCreateProtocolUtility } from "../common/getters";
import {
  EULER_ADDRESS,
  EULER_GENERAL_VIEW_ADDRESS,
  ZERO_ADDRESS,
  TransactionType,
  EULER_GENERAL_VIEW_V2_ADDRESS,
  VIEW_V2_START_BLOCK_NUMBER,
} from "../common/constants";
import {
  updateFinancials,
  updateMarketDailyMetrics,
  updateMarketHourlyMetrics,
  updateUsageMetrics,
} from "../common/metrics";
import {
  createBorrow,
  createDeposit,
  createLiquidation,
  createMarket,
  createRepay,
  createWithdraw,
  syncWithEulerGeneralView,
  updateAsset,
  updateLendingFactors,
} from "./helpers";

export function handleAssetStatus(event: AssetStatus): void {
  updateAsset(event);
}

export function handleBorrow(event: Borrow): void {
  const borrowUSD = createBorrow(event);
  const marketId = event.params.underlying.toHexString();
  updateUsageMetrics(event, event.params.account, TransactionType.BORROW);
  updateProtocolAndMarkets(event.block);
  updateFinancials(event.block, borrowUSD, TransactionType.BORROW);
  updateMarketDailyMetrics(event.block, marketId, borrowUSD, TransactionType.BORROW);
  updateMarketHourlyMetrics(event.block, marketId, borrowUSD, TransactionType.BORROW);
}

export function handleDeposit(event: Deposit): void {
  const depositUSD = createDeposit(event);
  const marketId = event.params.underlying.toHexString();
  updateUsageMetrics(event, event.params.account, TransactionType.DEPOSIT);
  updateProtocolAndMarkets(event.block);
  updateFinancials(event.block, depositUSD, TransactionType.DEPOSIT);
  updateMarketDailyMetrics(event.block, marketId, depositUSD, TransactionType.DEPOSIT);
  updateMarketHourlyMetrics(event.block, marketId, depositUSD, TransactionType.DEPOSIT);
}

export function handleRepay(event: Repay): void {
  const repayUSD = createRepay(event);
  const marketId = event.params.underlying.toHexString();
  updateUsageMetrics(event, event.params.account, TransactionType.REPAY);
  updateProtocolAndMarkets(event.block);
  updateFinancials(event.block, repayUSD, TransactionType.REPAY);
  updateMarketDailyMetrics(event.block, marketId, repayUSD, TransactionType.REPAY);
  updateMarketHourlyMetrics(event.block, marketId, repayUSD, TransactionType.REPAY);
}

export function handleWithdraw(event: Withdraw): void {
  const withdrawUSD = createWithdraw(event);
  const marketId = event.params.underlying.toHexString();
  updateUsageMetrics(event, event.params.account, TransactionType.WITHDRAW);
  updateProtocolAndMarkets(event.block);
  updateFinancials(event.block, withdrawUSD, TransactionType.WITHDRAW);
  updateMarketDailyMetrics(event.block, marketId, withdrawUSD, TransactionType.WITHDRAW);
  updateMarketHourlyMetrics(event.block, marketId, withdrawUSD, TransactionType.WITHDRAW);
}

export function handleLiquidation(event: Liquidation): void {
  const liquidateUSD = createLiquidation(event);
  const marketId = event.params.underlying.toHexString();
  updateUsageMetrics(event, event.params.liquidator, TransactionType.LIQUIDATE);
  updateProtocolAndMarkets(event.block);
  updateFinancials(event.block, liquidateUSD, TransactionType.LIQUIDATE);
  updateMarketDailyMetrics(event.block, marketId, liquidateUSD, TransactionType.LIQUIDATE);
  updateMarketHourlyMetrics(event.block, marketId, liquidateUSD, TransactionType.LIQUIDATE);
}

export function handleGovSetAssetConfig(event: GovSetAssetConfig): void {
  updateLendingFactors(event);
}

export function handleMarketActivated(event: MarketActivated): void {
  createMarket(event);
}

function getEulerViewContract(block: ethereum.Block): EulerGeneralView {
  const viewAddress = block.number.gt(VIEW_V2_START_BLOCK_NUMBER)
    ? EULER_GENERAL_VIEW_V2_ADDRESS
    : EULER_GENERAL_VIEW_ADDRESS;
  return EulerGeneralView.bind(Address.fromString(viewAddress));
}

/**
 * Query Euler General View contract in order to get markets current status.
 *
 * @param marketIds List of markets to query
 * @param block current block
 * @returns query resul or null if nothing could be queried.
 */
function queryEulerGeneralView(
  marketIds: string[],
  block: ethereum.Block,
): EulerGeneralView__doQueryResultRStruct | null {
  if (marketIds.length === 0) {
    return null; // No market is initialized, nothing to do.
  }

  const marketAddresses: Array<Address> = marketIds.map<Address>((market: string) => Address.fromString(market));

  const queryParameters: Array<ethereum.Value> = [
    ethereum.Value.fromAddress(Address.fromString(EULER_ADDRESS)),
    ethereum.Value.fromAddress(Address.fromString(ZERO_ADDRESS)),
    ethereum.Value.fromAddressArray(marketAddresses),
  ];

  const queryParametersTuple = changetype<EulerGeneralView__doQueryInputQStruct>(queryParameters);
  const eulerGeneralView = getEulerViewContract(block);
  const result = eulerGeneralView.try_doQuery(queryParametersTuple);

  if (result.reverted) {
    return null;
  }

  return result.value;
}

// initiates market / protocol updates in syncWithEulerGeneralView()
function updateProtocolAndMarkets(block: ethereum.Block): void {
  const blockNumber = block.number.toI32();
  const protocolUtility = getOrCreateProtocolUtility(blockNumber);
  const markets = protocolUtility.markets;

  if (protocolUtility.lastBlockNumber >= blockNumber - 120) {
    // Do this update every 120 blocks
    // this equates to about 30 minutes on ethereum mainnet
    // this is done since the following logic slows down the indexer
    return;
  }

  const eulerViewQueryResult = queryEulerGeneralView(markets, block);
  if (!eulerViewQueryResult) {
    return;
  }

  // update block number
  protocolUtility.lastBlockNumber = blockNumber;
  protocolUtility.save();

  syncWithEulerGeneralView(eulerViewQueryResult, block);
}
