import { Address, log } from "@graphprotocol/graph-ts";
import {
  PostTotalShares,
  LidoOracle,
} from "../../generated/LidoOracle/LidoOracle";
import {
  updateTotalRevenueMetrics,
  updateSupplySideRevenueMetrics,
} from "../entityUpdates/financialMetrics";
import { BIGINT_ZERO, PROTOCOL_ORACLE_ID } from "../utils/constants";

export function handlePostTotalShares(event: PostTotalShares): void {
  // updateTotalRevenueMetrics(
  //   event.block,
  //   event.params.postTotalPooledEther,
  //   event.params.preTotalPooledEther,
  //   event.params.totalShares
  // );
  // updateSupplySideRevenueMetrics(event.block);
}
