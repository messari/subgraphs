import { PostTotalShares } from "../../generated/LidoOracle/LidoOracle";
import {
  updateTotalRevenueMetrics,
  updateSupplySideRevenueMetrics,
} from "../entityUpdates/financialMetrics";

export function handlePostTotalShares(event: PostTotalShares): void {
  updateTotalRevenueMetrics(
    event.block,
    event.params.postTotalPooledEther,
    event.params.preTotalPooledEther,
    event.params.totalShares
  );
  updateSupplySideRevenueMetrics(event.block);
}
