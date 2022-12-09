import { PostTotalShares } from "../../generated/Lido/LidoOracle";
import {
  updateProtocolAndPoolTvl,
  updateSupplySideRevenueMetrics,
  updateTotalRevenueMetrics,
} from "../entityUpdates/financialMetrics";
import { BIGINT_ZERO, PROTOCOL_ID } from "../utils/constants";
import { Lido } from "../../generated/Lido/Lido";
import { Address } from "@graphprotocol/graph-ts";

export function handlePostTotalShares(event: PostTotalShares): void {
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
