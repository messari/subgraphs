import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { Registry } from "../../generated/Factory/Registry";
import {
  Coin,
  DexAmmProtocol,
  FinancialsDailySnapshot,
  LiquidityPool,
} from "../../generated/schema";
import {
  BIGDECIMAL_ONE,
  BIGDECIMAL_ZERO,
  FEE_DECIMALS,
  REGISTRY_ADDRESS,
  SECONDS_PER_DAY,
  toDecimal,
} from "../utils/constant";

export function updateFinancials(
  event: ethereum.Event,
  pool: LiquidityPool,
  protocol: DexAmmProtocol
): void {
  let timestamp = event.block.timestamp;
  let blockNumber = event.block.number;

  // Number of days since Unix epoch
  let id = timestamp.toI64() / SECONDS_PER_DAY;

  let registryContract = Registry.bind(Address.fromString(REGISTRY_ADDRESS));

  let financialMetrics = FinancialsDailySnapshot.load(id.toString());

  if (financialMetrics == null) {
    financialMetrics = new FinancialsDailySnapshot(id.toString());
    financialMetrics.protocol = protocol.id;

    // financialMetrics.feesUSD = BIGDECIMAL_ZERO;
    // financialMetrics.totalVolumeUSD = BIGDECIMAL_ZERO;
    // financialMetrics.totalValueLockedUSD = BIGDECIMAL_ZERO;
    // financialMetrics.supplySideRevenueUSD = BIGDECIMAL_ZERO;
    // financialMetrics.protocolSideRevenueUSD = BIGDECIMAL_ZERO;

    financialMetrics.blockNumber = blockNumber;
    financialMetrics.timestamp = timestamp;

    financialMetrics.save();
  }
  let totalFee = BIGDECIMAL_ZERO;
  for (let i = 0; i < pool._coinCount.toI32(); ++i) {
    let coin = Coin.load(pool.id.concat("-").concat(i.toString()));
    if (coin !== null) {
      // totalFee = totalFee.plus(coin.feeBalanceUSD);
    }
  }
  // financialMetrics.feesUSD = financialMetrics.feesUSD.plus(totalFee);

  let getFee = registryContract.try_get_fees(Address.fromString(pool.id));
  let fee: BigInt[] = getFee.reverted ? [] : getFee.value;
  let adminFee = toDecimal(fee[1], FEE_DECIMALS);
  let protocolFee = BIGDECIMAL_ONE.minus(adminFee);
  // financialMetrics.supplySideRevenueUSD = totalFee.times(adminFee);
  // financialMetrics.protocolSideRevenueUSD = totalFee.times(protocolFee);
  // financialMetrics.totalVolumeUSD = pool.totalVolumeUSD;
  // financialMetrics.totalValueLockedUSD = pool.totalValueLockedUSD;

  // Update the block number and timestamp to that of the last transaction of that day
  financialMetrics.blockNumber = blockNumber;
  financialMetrics.timestamp = timestamp;

  financialMetrics.save();
}

