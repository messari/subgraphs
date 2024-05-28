import {
  FullWithdrawal,
  PartialWithdrawal,
} from "../../generated/NodesManager/NodesManager";
import * as constants from "../common/constants";
import { Address } from "@graphprotocol/graph-ts";
import { getOrCreatePool, initializeSDK } from "../common/initializers";

export function handleFullWithdrawal(event: FullWithdrawal): void {
  const sdk = initializeSDK(event);
  const pool = getOrCreatePool(
    Address.fromString(constants.EETH_LIQUIDITY_POOL_ADDRESS),
    sdk
  );

  const inputToken = sdk.Tokens.getOrCreateToken(
    Address.fromString(constants.ETH_ADDRESS)
  );

  const supplySideRevenue = event.params.toOperator
    .plus(event.params.toBnft)
    .plus(event.params.toTnft);
  const protocolSideRevenue = event.params.toTreasury;

  pool.addRevenueNative(inputToken, supplySideRevenue, protocolSideRevenue);
}

export function handlePartialWithdrawal(event: PartialWithdrawal): void {
  const sdk = initializeSDK(event);
  const pool = getOrCreatePool(
    Address.fromString(constants.EETH_LIQUIDITY_POOL_ADDRESS),
    sdk
  );

  const inputToken = sdk.Tokens.getOrCreateToken(
    Address.fromString(constants.ETH_ADDRESS)
  );

  const supplySideRevenue = event.params.toOperator
    .plus(event.params.toBnft)
    .plus(event.params.toTnft);
  const protocolSideRevenue = event.params.toTreasury;

  pool.addRevenueNative(inputToken, supplySideRevenue, protocolSideRevenue);
}
