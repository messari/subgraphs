import { Address } from "@graphprotocol/graph-ts";
import { Claimed } from "../../generated/Rewards/Rewards";
import { TOKE_ADDRESS } from "../common/constants";
import { getOrCreateFinancialMetrics } from "../common/financial";
import { getOrCreateToken } from "../common/tokens";
import { updateUsageMetrics } from "../common/usage";
import { normalizedUsdcPrice, usdcPrice } from "../price/usdcOracle";

export function handleClaim(event: Claimed): void {
  let financialMetrics = getOrCreateFinancialMetrics(event.block.timestamp);
  const token = getOrCreateToken(Address.fromString(TOKE_ADDRESS));
  const amountUSD = normalizedUsdcPrice(usdcPrice(token, event.params.amount));
  financialMetrics.supplySideRevenueUSD = financialMetrics.supplySideRevenueUSD.plus(amountUSD);
  financialMetrics.save();
  updateUsageMetrics(event.block.number, event.block.timestamp, event.params.recipient);
}
