import { PostTotalShares } from "../../generated/Lido/LidoOracle";
import {
  updateProtocolAndPoolTvl,
  updateSupplySideRevenueMetrics,
  updateTotalRevenueMetrics,
} from "../entityUpdates/financialMetrics";
import {
  BIGINT_ZERO,
  LIDO_V2_UPGRADE_BLOCK,
  PROTOCOL_ID,
} from "../utils/constants";
import { Lido } from "../../generated/Lido/Lido";
import { Address } from "@graphprotocol/graph-ts";

export function handlePostTotalShares(event: PostTotalShares): void {
  // In Lido v2, PostTotalShares has been deprecated.
  // The new ETHDistributed event emitted from the main Lido contract is used instead for calculating revenue.
  // Ref: https://docs.lido.fi/integrations/api/#last-lido-apr-for-steth
  if (event.block.number >= LIDO_V2_UPGRADE_BLOCK) {
    return;
  }

  // PostTotalShares is emitted by the oracle once a day when
  // eth rewards are updated and minted as shares on the Lido contract.
  // We use this event to calculate total & supply side revenue.
  // Protocol revenue is calulated in the Lido mapping, by listening to
  // mint events to treasury and node operators.
  const totalRevenue = event.params.postTotalPooledEther.minus(
    event.params.preTotalPooledEther
  );
  const lido = Lido.bind(Address.fromString(PROTOCOL_ID));
  const supply = lido.totalSupply();
  updateTotalRevenueMetrics(event.block, totalRevenue, supply);
  updateSupplySideRevenueMetrics(event.block);
  updateProtocolAndPoolTvl(event.block, BIGINT_ZERO);
}
