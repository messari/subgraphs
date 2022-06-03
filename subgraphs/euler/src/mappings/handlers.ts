import { Address, ethereum } from "@graphprotocol/graph-ts";
import {
  AssetStatus,
  Borrow,
  Deposit,
  GovSetAssetConfig,
  GovSetReserveFee,
  Liquidation,
  Repay,
  Withdraw
} from "../../generated/euler/Euler"
import {
  EulerGeneralView,
  EulerGeneralView__doQueryInputQStruct,
  EulerGeneralView__doQueryResultRStruct
} from "../../generated/euler/EulerGeneralView";
import {
  getOrCreateProtocolUtility,
} from "../common/getters";
import {
  BIGINT_ZERO,
  EULER_ADDRESS,
  EULER_GENERAL_VIEW_ADDRESS,
  ZERO_ADDRESS,
  TransactionType,
  EULER_GENERAL_VIEW_V2_ADDRESS,
  VIEW_V2_START_BLOCK_NUMBER,
} from "../common/constants";
import { updateFinancials, updateUsageMetrics } from "../common/metrics";
import { _MarketUtility } from "../../generated/schema";
import { BigInt } from "@graphprotocol/graph-ts";
import {
  createBorrow,
  createDeposit,
  createLiquidation,
  createRepay,
  createWithdraw,
  syncWithEulerGeneralView,
  updateAsset,
  updateLendingFactors,
  updateReserveFee,
} from "./helpers";

export function handleAssetStatus(event: AssetStatus): void {
  updateAsset(event);
}

export function handleBorrow(event: Borrow): void {
  createBorrow(event);
  updateUsageMetrics(event, event.params.account, TransactionType.BORROW);
}

export function handleDeposit(event: Deposit): void {
  createDeposit(event);
  updateUsageMetrics(event, event.params.account, TransactionType.DEPOSIT);
}

export function handleRepay(event: Repay): void {
  createRepay(event);
  updateUsageMetrics(event, event.params.account, TransactionType.REPAY);
}

export function handleWithdraw(event: Withdraw): void {
  createWithdraw(event);
  updateUsageMetrics(event, event.params.account, TransactionType.WITHDRAW);
}

export function handleLiquidation(event: Liquidation): void {
  createLiquidation(event);
  updateUsageMetrics(event, event.params.liquidator, TransactionType.LIQUIDATE);
}

export function handleGovSetAssetConfig(event: GovSetAssetConfig): void {
 updateLendingFactors(event);
}

export function handleGovSetReserveFee(event: GovSetReserveFee): void {
  updateReserveFee(event);
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
 * @param block block number at which
 * @returns query resul or null if nothing could be queried.
 */
function queryEulerGeneralView(marketIds: string[], block: ethereum.Block): EulerGeneralView__doQueryResultRStruct | null {
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

export function handleBlockUpdates(block: ethereum.Block): void {
  if (!block.number.mod(BigInt.fromI32(50)).equals(BIGINT_ZERO)) {
    return; // Do this update every 50 block (every ~10min).
  }

  const protocolUtility = getOrCreateProtocolUtility();
  const markets = protocolUtility.markets;

  const eulerViewQueryResult = queryEulerGeneralView(markets, block);
  if (!eulerViewQueryResult) {
    return;
  }

  syncWithEulerGeneralView(eulerViewQueryResult, block);
  updateFinancials(block);
}
