import {
  getOrCreatePool,
  initializeSDKFromEvent,
} from "../common/initializers";
import { ExchangeRateUpdated } from "../../generated/StaderOracle/StaderOracle";

export function handleExchangeRateUpdated(event: ExchangeRateUpdated): void {
  const inputTokenBalance = event.params.totalEth;
  const outputTokenSupply = event.params.ethxSupply;

  const sdk = initializeSDKFromEvent(event);
  const pool = getOrCreatePool(event.address, sdk);

  pool.setInputTokenBalances([inputTokenBalance], true);
  pool.setOutputTokenSupply(outputTokenSupply);
}
