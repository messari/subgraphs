import { Address, BigDecimal, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { BeefyStrategy } from "../../generated/ExampleVault/BeefyStrategy";
import { User, Vault, VaultFee, YieldAggregator } from "../../generated/schema";
import {
  BIGDECIMAL_HUNDRED,
  BIGDECIMAL_ZERO,
  BIGINT_ONE,
  BIGINT_TEN,
  BIGINT_ZERO,
} from "../prices/common/constants";
import { getBeefyFinanceOrCreate, getTokenOrCreate } from "../utils/getters";
import {
  updateDailyFinancialSnapshot,
  updateUsageMetricsDailySnapshot,
  updateUsageMetricsHourlySnapshot,
} from "../utils/metrics";
import { getFees } from "./vault";

export function updateProtocolUsage(
  event: ethereum.Event,
  vault: Vault,
  deposit: boolean,
  withdraw: boolean
): void {
  const protocol = getBeefyFinanceOrCreate(vault.id);
  protocol.totalValueLockedUSD = getTvlUsd(protocol);
  protocol.protocolControlledValueUSD = protocol.totalValueLockedUSD;
  protocol.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers.plus(
    isNewUser(event.transaction.from)
  );
  protocol.save();

  updateUsageMetricsDailySnapshot(event, protocol, deposit, withdraw);
  updateUsageMetricsHourlySnapshot(event, protocol, deposit, withdraw);
}

export function updateProtocolRevenue(
  event: ethereum.Event,
  amountHarvested: BigInt,
  vault: Vault
): void {
  updateProtocolUsage(event, vault, false, false);
  const protocol = getBeefyFinanceOrCreate(vault.id);
  const token = getTokenOrCreate(
    Address.fromString(vault.inputToken.split("x")[1]),
    event.block
  );
  const transactionRevenue = amountHarvested
    .toBigDecimal()
    .times(token.lastPriceUSD)
    .div(BIGINT_TEN.pow(token.decimals as u8).toBigDecimal());
  protocol.cumulativeTotalRevenueUSD = protocol.cumulativeTotalRevenueUSD.plus(
    transactionRevenue
  );
  vault.fees = getFees(
    vault.id,
    BeefyStrategy.bind(Address.fromString(vault.strategy.split("x")[1]))
  );
  vault.save();
  let fee: VaultFee | null;
  let currentRevenueProtocolSide = BIGDECIMAL_ZERO;
  let currentRevenueSupplySide = transactionRevenue;
  for (let k = 0; k < vault.fees.length; k++) {
    fee = VaultFee.load(vault.fees[k]);
    if (fee) {
      if (fee.id == "PERFORMANCE_FEE-" + vault.id) {
        currentRevenueProtocolSide = currentRevenueProtocolSide.plus(
          transactionRevenue.times(fee.feePercentage).div(BIGDECIMAL_HUNDRED)
        );
        currentRevenueSupplySide = currentRevenueSupplySide.minus(
          transactionRevenue.times(fee.feePercentage).div(BIGDECIMAL_HUNDRED)
        );
        continue;
      }

      if (fee.id == "STRATEGIST_FEE-" + vault.id) {
        currentRevenueSupplySide = currentRevenueSupplySide.minus(
          transactionRevenue.times(fee.feePercentage).div(BIGDECIMAL_HUNDRED)
        );
        continue;
      }

      if (fee.id == "MANAGEMENT_FEE-" + vault.id) {
        currentRevenueSupplySide = currentRevenueSupplySide.minus(
          transactionRevenue.times(fee.feePercentage).div(BIGDECIMAL_HUNDRED)
        );
        continue;
      }
    }
  }
  protocol.cumulativeProtocolSideRevenueUSD = protocol.cumulativeProtocolSideRevenueUSD.plus(
    currentRevenueProtocolSide
  );
  protocol.cumulativeSupplySideRevenueUSD = protocol.cumulativeSupplySideRevenueUSD.plus(
    currentRevenueSupplySide
  );
  protocol.save();

  updateDailyFinancialSnapshot(event.block, protocol);
}

export function getTvlUsd(protocol: YieldAggregator): BigDecimal {
  let tvlUsd = BIGDECIMAL_ZERO;
  if (protocol.vaults) {
    for (let i = 0; i < protocol.vaults.length; i++) {
      const vault = Vault.load(protocol.vaults[i]);
      if (vault) {
        tvlUsd = tvlUsd.plus(vault.totalValueLockedUSD);
      }
    }
  }
  return tvlUsd;
}

function isNewUser(user: Address): BigInt {
  let userEntity = User.load(user.toHexString());
  if (userEntity) {
    return BIGINT_ZERO;
  } else userEntity = new User(user.toHexString());
  userEntity.save();
  return BIGINT_ONE;
}
