import { Address, BigDecimal } from "@graphprotocol/graph-ts";
import { Claimed } from "../../generated/Rewards/Rewards";
import { BIGINT_TEN, TOKE_ADDRESS } from "../common/constants";
import { getOrCreateFinancialMetrics } from "../common/financial";
import { getOrCreateProtocol } from "../common/protocol";
import { getOrCreateToken } from "../common/tokens";
import { updateUsageMetrics } from "../common/usage";
import { getUsdPrice } from "../prices";

export function handleClaim(event: Claimed): void {
  let financialMetrics = getOrCreateFinancialMetrics(event.block.timestamp, event.block.number);
  const protocol = getOrCreateProtocol();
  const token = getOrCreateToken(Address.fromString(TOKE_ADDRESS));

  const decimals = BIGINT_TEN.pow(u8(token.decimals));
  const amountUSD = getUsdPrice(Address.fromString(token.id), new BigDecimal(event.params.amount.div(decimals)));

  financialMetrics.dailySupplySideRevenueUSD = financialMetrics.dailySupplySideRevenueUSD.plus(amountUSD);
  protocol.cumulativeSupplySideRevenueUSD = protocol.cumulativeSupplySideRevenueUSD.plus(amountUSD);
  financialMetrics.save();
  protocol.save();
  updateUsageMetrics(event.block, event.params.recipient);
}
