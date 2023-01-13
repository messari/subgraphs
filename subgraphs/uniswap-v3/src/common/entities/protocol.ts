import { BigDecimal, ethereum } from "@graphprotocol/graph-ts";
import { NetworkConfigs } from "../../../configurations/configure";
import { DexAmmProtocol } from "../../../generated/schema";
import { Versions } from "../../versions";
import {
  BIGDECIMAL_ONE,
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  INT_ZERO,
  ProtocolType,
} from "../constants";
import { getLiquidityPool, getLiquidityPoolFee } from "./pool";
import { Pool } from "../../../generated/templates/Pool/Pool";

export function getOrCreateProtocol(): DexAmmProtocol {
  let protocol = DexAmmProtocol.load(NetworkConfigs.getFactoryAddress());

  if (!protocol) {
    protocol = new DexAmmProtocol(NetworkConfigs.getFactoryAddress());
    protocol.name = NetworkConfigs.getProtocolName();
    protocol.slug = NetworkConfigs.getProtocolSlug();
    protocol.totalValueLockedUSD = BIGDECIMAL_ZERO;
    protocol.activeLiquidityUSD = BIGDECIMAL_ZERO;
    protocol.totalLiquidityUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeVolumeUSD = BIGDECIMAL_ZERO;
    protocol.uncollectedProtocolSideValueUSD = BIGDECIMAL_ZERO;
    protocol.uncollectedSupplySideValueUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeUniqueUsers = INT_ZERO;
    protocol.cumulativeUniqueTraders = INT_ZERO;
    protocol.cumulativeUniqueLPs = INT_ZERO;
    protocol.openPositionCount = INT_ZERO;
    protocol.cumulativePositionCount = INT_ZERO;
    protocol.network = NetworkConfigs.getNetwork();
    protocol.type = ProtocolType.EXCHANGE;
    protocol.totalPoolCount = INT_ZERO;
    protocol._regenesis = false;
    protocol.lastSnapshotsDayID = INT_ZERO;
    protocol.lastUpdateBlockNumber = BIGINT_ZERO;
    protocol.lastUpdateTimestamp = BIGINT_ZERO;
  }

  protocol.schemaVersion = Versions.getSchemaVersion();
  protocol.subgraphVersion = Versions.getSubgraphVersion();
  protocol.methodologyVersion = Versions.getMethodologyVersion();
  protocol.save();

  return protocol;
}

// Updated protocol fees if specified by SetFeeProtocol event
export function updateProtocolFees(event: ethereum.Event): void {
  const poolContract = Pool.bind(event.address);
  const pool = getLiquidityPool(event.address)!;

  const tradingFee = getLiquidityPoolFee(pool.fees[0]);
  const protocolFee = getLiquidityPoolFee(pool.fees[1]);

  // Get the total proportion of swap value collected as a fee
  const totalPoolFee = tradingFee.feePercentage!.plus(
    protocolFee.feePercentage!
  );

  // Value5 is the feeProtocol variabe in the slot0 struct of the pool contract
  const feeProtocol = poolContract.slot0().value5;
  const protocolFeeProportion = BIGDECIMAL_ONE.div(
    BigDecimal.fromString(feeProtocol.toString())
  );

  // Update protocol and trading fees for this pool
  tradingFee.feePercentage = totalPoolFee.times(
    BIGDECIMAL_ONE.minus(protocolFeeProportion)
  );
  protocolFee.feePercentage = totalPoolFee.times(protocolFeeProportion);

  tradingFee.save();
  protocolFee.save();
}
