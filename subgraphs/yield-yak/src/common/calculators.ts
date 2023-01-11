import {
  Address,
  BigDecimal,
  bigDecimal,
  bigInt,
  BigInt,
  ethereum,
} from "@graphprotocol/graph-ts";
import { YakRouter } from "../../generated/YakStrategyV2/YakRouter";
import { YakStrategyV2 } from "../../generated/YakStrategyV2/YakStrategyV2";
import {
  ZERO_BIGDECIMAL,
  DEFUALT_AMOUNT,
  USDC_ADDRESS,
  WAVAX_CONTRACT_ADDRESS,
  YAK_ROUTER_ADDRESS,
  ZERO_ADDRESS,
  FEE_DIVISOR,
} from "../helpers/constants";
import { convertBigIntToBigDecimal } from "../helpers/converters";
import { getUsdPricePerToken } from "../Prices";
import { getOrCreateVault } from "./initializers";

export function calculateAllDistributedRewardInUSD(
  contractAddress: Address,
  distributedReward: BigInt
): BigDecimal {
  const strategyContract = YakStrategyV2.bind(contractAddress);
  let rewardTokenPrice: BigDecimal;

  if (strategyContract.try_depositToken().reverted) {
    rewardTokenPrice = ZERO_BIGDECIMAL;
  } else {
    // rewardTokenPrice = calculatePriceInUSD(strategyContract.depositToken(), DEFUALT_AMOUNT);
    rewardTokenPrice = getUsdPricePerToken(
      strategyContract.depositToken()
    ).usdPrice.div(DEFUALT_AMOUNT.toBigDecimal());
  }

  let allFees: BigDecimal;

  if (
    strategyContract.try_DEV_FEE_BIPS().reverted ||
    strategyContract.try_ADMIN_FEE_BIPS().reverted ||
    strategyContract.try_REINVEST_REWARD_BIPS().reverted
  ) {
    allFees = ZERO_BIGDECIMAL;
  } else {
    allFees = strategyContract
      .DEV_FEE_BIPS()
      .plus(strategyContract.ADMIN_FEE_BIPS())
      .plus(strategyContract.REINVEST_REWARD_BIPS())
      .toBigDecimal()
      .div(bigDecimal.fromString("1000"));
  }

  let allDistributedReward: BigDecimal;

  const distributedRewardUSD = rewardTokenPrice.times(
    convertBigIntToBigDecimal(distributedReward, 18)
  );

  if (allFees == ZERO_BIGDECIMAL) {
    allDistributedReward = ZERO_BIGDECIMAL;
  } else {
    allDistributedReward = distributedRewardUSD.times(allFees);
  }

  return allDistributedReward;
}

export function calculateDistributedReward(
  contractAddress: Address,
  block: ethereum.Block,
  newTotalSupply: BigInt
): BigInt {
  const vault = getOrCreateVault(contractAddress, block);
  const beforeReinvestSupply = vault.outputTokenSupply;

  return newTotalSupply.minus(beforeReinvestSupply);
}

export function calculateDistributedRewardInUSD(
  contractAddress: Address,
  distributedReward: BigInt
): BigDecimal {
  const strategyContract = YakStrategyV2.bind(contractAddress);
  let rewardTokenPrice: BigDecimal;

  if (strategyContract.try_depositToken().reverted) {
    rewardTokenPrice = ZERO_BIGDECIMAL;
  } else {
    // rewardTokenPrice = calculatePriceInUSD(strategyContract.depositToken(), DEFUALT_AMOUNT);
    rewardTokenPrice = getUsdPricePerToken(
      strategyContract.depositToken()
    ).usdPrice.div(DEFUALT_AMOUNT.toBigDecimal());
  }

  return rewardTokenPrice.times(
    convertBigIntToBigDecimal(distributedReward, 18)
  );
}


export function calculatePriceInUSD(
  tokenAddress: Address,
  amount: BigInt
): BigDecimal {
  const avaxAddress = ZERO_ADDRESS;

  if (tokenAddress == avaxAddress) {
    tokenAddress = WAVAX_CONTRACT_ADDRESS;
  }

  let tokenPriceInUSDWithDecimal = getPriceInUsd("2", amount, tokenAddress);

  if (tokenPriceInUSDWithDecimal == ZERO_BIGDECIMAL) {
    tokenPriceInUSDWithDecimal = getPriceInUsd("3", amount, tokenAddress);
  }

  if (tokenPriceInUSDWithDecimal == ZERO_BIGDECIMAL) {
    tokenPriceInUSDWithDecimal = getPriceInUsd("4", amount, tokenAddress);
  }

  return tokenPriceInUSDWithDecimal;
}

function getPriceInUsd(
  pathLenght: string,
  amount: BigInt,
  tokenAddress: Address
): BigDecimal {
  const usdcAddress = USDC_ADDRESS;
  const yakRouterAddress = YAK_ROUTER_ADDRESS;
  const yakRouter = YakRouter.bind(yakRouterAddress);
  let tokenPriceInUSDWithDecimal: BigDecimal;

  if (
    yakRouter.try_findBestPath(
      amount,
      tokenAddress,
      usdcAddress,
      BigInt.fromString(pathLenght)
    ).reverted
  ) {
    tokenPriceInUSDWithDecimal = ZERO_BIGDECIMAL;
  } else {
    const tokenPriceInUSDStructure = yakRouter.findBestPath(
      amount,
      tokenAddress,
      usdcAddress,
      bigInt.fromString(pathLenght)
    );

    if (tokenPriceInUSDStructure.amounts.length == 0) {
      tokenPriceInUSDWithDecimal = ZERO_BIGDECIMAL;
    } else {
      if (
        tokenPriceInUSDStructure.path[
          tokenPriceInUSDStructure.amounts.length - 1
        ] == usdcAddress
      ) {
        tokenPriceInUSDWithDecimal = convertBigIntToBigDecimal(
          tokenPriceInUSDStructure.amounts[
            tokenPriceInUSDStructure.amounts.length - 1
          ],
          6
        );
      } else {
        tokenPriceInUSDWithDecimal = ZERO_BIGDECIMAL;
      }
    }
  }

  return tokenPriceInUSDWithDecimal;
}

export function calculateProtocolRewardInUSD(
  contractAddress: Address,
  distributedReward: BigInt
): BigDecimal {
  const strategyContract = YakStrategyV2.bind(contractAddress);
  let rewardTokenPrice: BigDecimal;

  if (strategyContract.try_depositToken().reverted) {
    rewardTokenPrice = ZERO_BIGDECIMAL;
  } else {
    // rewardTokenPrice = calculatePriceInUSD(strategyContract.depositToken(), DEFUALT_AMOUNT);
    rewardTokenPrice = getUsdPricePerToken(
      strategyContract.depositToken()
    ).usdPrice.div(DEFUALT_AMOUNT.toBigDecimal());
  }

  const distributedRewardUSD = rewardTokenPrice.times(
    convertBigIntToBigDecimal(distributedReward, 18)
  );

  let protocolSideFee: BigDecimal;
  let protocolReward: BigDecimal;

  if (strategyContract.try_DEV_FEE_BIPS().reverted) {
    protocolSideFee = ZERO_BIGDECIMAL;
    protocolReward = ZERO_BIGDECIMAL;
  } else {
    protocolSideFee = strategyContract
      .DEV_FEE_BIPS()
      .toBigDecimal()
      .div(FEE_DIVISOR);

    protocolReward = distributedRewardUSD.times(protocolSideFee);
  }

  return protocolReward;
}
