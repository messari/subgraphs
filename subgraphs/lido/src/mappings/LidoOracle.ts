import { PostTotalShares } from "../../generated/LidoOracle/LidoOracle";
import { updateTotalRevenueMetrics } from "../financialMetrics";
import { updateSupplySideRevenueMetrics } from "../financialMetrics";

export function handlePostTotalShares(event: PostTotalShares): void {
  updateTotalRevenueMetrics(
    event.block,
    event.params.postTotalPooledEther,
    event.params.preTotalPooledEther,
    event.params.totalShares
  );
  updateSupplySideRevenueMetrics(event.block);
}
