import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { LiquidityPoolFee } from "../../generated/schema";
import {
  BIGDECIMAL_HUNDRED,
  FEE_PRECISION,
  INT_TWO,
  LiquidityPoolFeeType,
} from "../utils/constants";
import { bigIntToBigDecimal } from "../utils/numbers";
import { prefixID } from "../utils/strings";

function createOrUpdateFee(
  address: Address,
  feeType: string,
  feePercentage: BigDecimal
): LiquidityPoolFee {
  const id = prefixID(feeType, address.toHexString());
  let fee = LiquidityPoolFee.load(id);
  if (!fee) {
    fee = new LiquidityPoolFee(id);
    fee.feeType = feeType;
  }
  fee.feePercentage = feePercentage;
  fee.save();
  return fee;
}

export function createOrUpdateAllFees(
  address: Address,
  totalFee: BigInt,
  adminFee: BigInt
): string[] {
  // -2 to get percentage value, e.g 0.5 = 50%
  const tradingFeePercent = bigIntToBigDecimal(
    totalFee,
    FEE_PRECISION - INT_TWO
  );
  const tradingFee = createOrUpdateFee(
    address,
    LiquidityPoolFeeType.FIXED_TRADING_FEE,
    tradingFeePercent
  );
  const protocolFeePercent = bigIntToBigDecimal(adminFee, FEE_PRECISION).times(
    tradingFeePercent
  );
  const protocolFee = createOrUpdateFee(
    address,
    LiquidityPoolFeeType.FIXED_PROTOCOL_FEE,
    protocolFeePercent
  );
  const lpFeePercentage = tradingFeePercent.minus(protocolFeePercent);
  const lpFee = createOrUpdateFee(
    address,
    LiquidityPoolFeeType.FIXED_LP_FEE,
    lpFeePercentage
  );
  return [tradingFee.id, protocolFee.id, lpFee.id];
}

export function getSupplySideFee(address: string): BigDecimal {
  const id = prefixID(LiquidityPoolFeeType.FIXED_LP_FEE, address);
  let fee = LiquidityPoolFee.load(id);
  return fee!.feePercentage!.div(BIGDECIMAL_HUNDRED);
}

export function getProtocolFee(address: string): BigDecimal {
  const id = prefixID(LiquidityPoolFeeType.FIXED_PROTOCOL_FEE, address);
  let fee = LiquidityPoolFee.load(id);
  return fee!.feePercentage!.div(BIGDECIMAL_HUNDRED);
}
