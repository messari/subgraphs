import { Address, ethereum, BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { YakStrategyV2 } from "../../generated/YakStrategyV2/YakStrategyV2";
import { getOrCreateVault } from "../common/initializers";
import { WAVAX_CONTRACT_ADDRESS, ZERO_BIGDECIMAL, FEE_DIVISOR } from "../helpers/constants";
import { convertBigIntToBigDecimal } from "../helpers/converters";
import { getUsdPricePerToken } from "../Prices";

export function calculateDistributedReward(
  contractAddress: Address,
  block: ethereum.Block,
  newTotalSupply: BigInt
): BigInt {
  const vault = getOrCreateVault(contractAddress, block);
  const beforeReinvestSupply = vault.outputTokenSupply;

  return newTotalSupply.minus(beforeReinvestSupply);
}

export function calculateDistributedRewardInUSD(distributedReward: BigInt): BigDecimal {
  const rewardTokenPrice = getUsdPricePerToken(WAVAX_CONTRACT_ADDRESS);

  return rewardTokenPrice.usdPrice.times(
    convertBigIntToBigDecimal(distributedReward, 18)
  );
}

export function calculateProtocolRewardInUSD(
  contractAddress: Address,
  distributedRewardUSD: BigDecimal
): BigDecimal {
  const strategyContract = YakStrategyV2.bind(contractAddress);

  let protocolSideFee: BigDecimal;
  let protocolReward: BigDecimal;

  if (strategyContract.try_REINVEST_REWARD_BIPS().reverted) {
    protocolSideFee = ZERO_BIGDECIMAL;
    protocolReward = ZERO_BIGDECIMAL;
  } else {
    protocolSideFee = strategyContract
      .REINVEST_REWARD_BIPS()
      .toBigDecimal()
      .div(FEE_DIVISOR);

    protocolReward = distributedRewardUSD.times(protocolSideFee);
  }

  return protocolReward;
}

export function calculateSupplyRewardInUSD(
  contractAddress: Address,
  distributedRewardUSD: BigDecimal
): BigDecimal {
  const strategyContract = YakStrategyV2.bind(contractAddress);

  let supplySideFee: BigDecimal;
  let supplyReward: BigDecimal;

  if (strategyContract.try_DEV_FEE_BIPS().reverted) {
    supplySideFee = ZERO_BIGDECIMAL;
    supplyReward = ZERO_BIGDECIMAL;
  } else {
    supplySideFee = strategyContract
      .DEV_FEE_BIPS()
      .toBigDecimal()
      .div(FEE_DIVISOR);

    supplyReward = distributedRewardUSD.times(supplySideFee);
  }

  return supplyReward;
}