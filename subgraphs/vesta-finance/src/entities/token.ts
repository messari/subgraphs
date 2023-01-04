import {
  Address,
  BigDecimal,
  BigInt,
  ethereum,
  log,
} from "@graphprotocol/graph-ts";
import { IERC20Detailed } from "../../generated/TroveManager/IERC20Detailed";
import { IERC20DetailedBytes } from "../../generated/TroveManager/IERC20DetailedBytes";
import { UniswapV2Pair } from "../../generated/TroveManager/UniswapV2Pair";
import { RewardToken, Token } from "../../generated/schema";
import {
  VSTA_BALANCER_POOL_CREATED_BLOCK,
  BAL_VSTA_WETH_POOL_ADDRESS,
  BAL_WETH_WBTC_USDC_POOL_ADDRESS,
  BIGDECIMAL_ONE,
  BIGDECIMAL_ZERO,
  DEFAULT_DECIMALS,
  EMPTY_STRING,
  ETH_ADDRESS,
  ETH_NAME,
  ETH_SYMBOL,
  PRICE_ORACLE_V1_ADDRESS,
  RewardTokenType,
  USDC_ADDRESS,
  USDC_DECIMALS,
  VSTA_ADDRESS,
  VST_ADDRESS,
  WETH_ADDRESS,
  BIGINT_ZERO,
  SUSHI_gOHM_WETH_PAIR_ADDRESS,
  gOHM_ADDRESS,
  SUSHI_WETH_USDC_PAIR_ADDRESS,
  gOHM_DECIMALS,
} from "../utils/constants";
import { bigIntToBigDecimal, exponentToBigDecimal } from "../utils/numbers";
import { PriceFeedV1 } from "../../generated/PriceFeedV1/PriceFeedV1";
import { getOrCreateLendingProtocol } from "./protocol";
import { WeightedPool as WeightedPoolContract } from "../../generated/CommunityIssuance/WeightedPool";
import { Vault as VaultContract } from "../../generated/CommunityIssuance/Vault";

export const UNKNOWN_TOKEN_VALUE = "unknown";

export function getOrCreateAssetToken(tokenAddress: Address): Token {
  return getOrCreateToken(tokenAddress);
}

export function getVSTToken(): Token {
  const token = getOrCreateToken(Address.fromString(VST_ADDRESS));
  if (!token.lastPriceUSD) {
    token.lastPriceUSD = BIGDECIMAL_ONE;
  }
  token.save();
  return token;
}

function getOrCreateToken(tokenAddress: Address): Token {
  let token = Token.load(tokenAddress.toHexString());

  if (!token) {
    token = new Token(tokenAddress.toHexString());
    if (tokenAddress.toHexString() == ETH_ADDRESS) {
      // Vesta finance use zero address as ETH reference address
      token.name = ETH_NAME;
      token.symbol = ETH_SYMBOL;
      token.decimals = DEFAULT_DECIMALS;
    } else {
      const contract = IERC20Detailed.bind(tokenAddress);
      token.name = fetchTokenName(contract);
      token.symbol = fetchTokenSymbol(contract);
      token.decimals = fetchTokenDecimals(contract);
    }

    token.lastPriceUSD = BIGDECIMAL_ZERO;
    token.save();
  }
  return token;
}

export function setCurrentAssetPrice(
  blockNumber: BigInt,
  asset: Address,
  price: BigInt
): void {
  const token = getOrCreateAssetToken(asset);

  let priceUSD = bigIntToBigDecimal(price);
  // get gOHM price from SushiSwap arbitrum because
  // Vesta price feed number is off
  if (asset.toHexString() == gOHM_ADDRESS) {
    const gOHMPrice = getgOHMPrice(blockNumber);
    priceUSD = gOHMPrice ? gOHMPrice : priceUSD;
  }
  token.lastPriceUSD = priceUSD;
  token.lastPriceBlockNumber = blockNumber;
  log.info("[setCurrentAssetPrice]asset {} price set to {} at block {}", [
    asset.toHexString(),
    priceUSD.toString(),
    blockNumber.toString(),
  ]);
  token.save();
}

export function getCurrentAssetPrice(asset: Address): BigDecimal {
  const assetToken = getOrCreateAssetToken(asset);
  return assetToken.lastPriceUSD!;
}

function isNullEthValue(value: string): boolean {
  return (
    value ==
    "0x0000000000000000000000000000000000000000000000000000000000000001"
  );
}

function fetchTokenName(contract: IERC20Detailed): string {
  // try types string and bytes32 for name
  let nameValue = UNKNOWN_TOKEN_VALUE;
  const tryNameResult = contract.try_name();
  if (!tryNameResult.reverted) {
    return tryNameResult.value;
  }

  // non-standard ERC20 implementation
  const contractNameBytes = IERC20DetailedBytes.bind(contract._address);
  const tryNameResultBytes = contractNameBytes.try_name();
  if (!tryNameResultBytes.reverted) {
    // for broken exchanges that have no name function exposed
    if (!isNullEthValue(tryNameResultBytes.value.toHexString())) {
      nameValue = tryNameResultBytes.value.toString();
    }
  }
  return nameValue;
}

function fetchTokenSymbol(contract: IERC20Detailed): string {
  const contractSymbolBytes = IERC20DetailedBytes.bind(contract._address);

  // try types string and bytes32 for symbol
  let symbolValue = UNKNOWN_TOKEN_VALUE;
  const trySymbolResult = contract.try_symbol();
  if (!trySymbolResult.reverted) {
    return trySymbolResult.value;
  }

  // non-standard ERC20 implementation
  const symbolResultBytes = contractSymbolBytes.try_symbol();
  if (!symbolResultBytes.reverted) {
    // for broken pairs that have no symbol function exposed
    if (!isNullEthValue(symbolResultBytes.value.toHexString())) {
      symbolValue = symbolResultBytes.value.toString();
    }
  }

  return symbolValue;
}

function fetchTokenDecimals(contract: IERC20Detailed): i32 {
  let decimalValue = DEFAULT_DECIMALS;
  const tryDecimalsResult = contract.try_decimals();
  if (!tryDecimalsResult.reverted) {
    decimalValue = tryDecimalsResult.value;
  }

  return decimalValue;
}

export function getOrCreateRewardToken(): RewardToken {
  const token = getOrCreateToken(Address.fromString(VSTA_ADDRESS));
  const id = `${RewardTokenType.DEPOSIT}-${token.id}`;

  let rToken = RewardToken.load(id);
  if (!rToken) {
    rToken = new RewardToken(id);
    rToken.type = RewardTokenType.DEPOSIT;
    rToken.token = token.id;
    rToken.save();
  }
  return rToken;
}

export function getVSTTokenPrice(event: ethereum.Event): BigDecimal {
  const protocol = getOrCreateLendingProtocol();
  const priceFeedAddress =
    protocol._priceOracle && protocol._priceOracle != EMPTY_STRING
      ? protocol._priceOracle
      : PRICE_ORACLE_V1_ADDRESS;

  // this should work for boh V1 and V2
  const priceFeedContract = PriceFeedV1.bind(
    Address.fromString(priceFeedAddress)
  );
  const lastGoodPriceResult = priceFeedContract.try_lastGoodPrice(
    Address.fromString(VST_ADDRESS)
  );

  let VSTPrice = BIGDECIMAL_ONE;
  if (
    lastGoodPriceResult.reverted ||
    lastGoodPriceResult.value.equals(BIGINT_ZERO)
  ) {
    log.warning(
      "[getVSTTokenPrice]Querying price for VST token with Price Feed {} failed at tx {}; Price set to 1.0",
      [priceFeedAddress, event.transaction.hash.toHexString()]
    );
  } else {
    //convert to decimals with 18 decimals
    VSTPrice = bigIntToBigDecimal(lastGoodPriceResult.value, 18);
  }

  log.info("[getVSTTokenPrice]Price Feed {} VST Price=${} at block {} tx {}", [
    priceFeedAddress,
    VSTPrice.toString(),
    event.block.number.toString(),
    event.transaction.hash.toHexString(),
  ]);

  return VSTPrice;
}

export function getVSTATokenPrice(event: ethereum.Event): BigDecimal | null {
  if (event.block.number.lt(VSTA_BALANCER_POOL_CREATED_BLOCK)) {
    return null;
  }
  const VSTAPriceInWETH = getToken0PriceInToken1(
    BAL_VSTA_WETH_POOL_ADDRESS,
    VSTA_ADDRESS,
    WETH_ADDRESS
  );

  const WETHPriceInUSD = getToken0PriceInToken1(
    BAL_WETH_WBTC_USDC_POOL_ADDRESS,
    WETH_ADDRESS,
    USDC_ADDRESS
  );

  if (!VSTAPriceInWETH || !WETHPriceInUSD) {
    return null;
  }
  const VSTAPriceInUSD = VSTAPriceInWETH.times(WETHPriceInUSD)
    .times(exponentToBigDecimal(DEFAULT_DECIMALS))
    .div(exponentToBigDecimal(USDC_DECIMALS));
  log.info("[getVSTATokenPrice]VSTA Price USD={} at timestamp {}", [
    VSTAPriceInUSD.toString(),
    event.block.timestamp.toString(),
  ]);

  return VSTAPriceInUSD;
}

function getToken0PriceInToken1(
  poolAddress: string,
  token0: string,
  token1: string
): BigDecimal | null {
  const poolContract = WeightedPoolContract.bind(
    Address.fromString(poolAddress)
  );
  const vaultAddressResult = poolContract.try_getVault();
  if (vaultAddressResult.reverted) {
    log.info(
      "[getToken0PriceInToken1]WeightedPoolContract ({}) getVault() call reverted",
      [poolAddress]
    );
    return null;
  }
  const vaultContract = VaultContract.bind(vaultAddressResult.value);
  const weightsResult = poolContract.try_getNormalizedWeights();
  if (weightsResult.reverted) {
    log.info(
      "[getToken0PriceInToken1]VaultContract ({}) getNormalizedWeights() call reverted",
      [vaultAddressResult.value.toHexString()]
    );
    return null;
  }
  const poolIDResult = poolContract.try_getPoolId();
  if (poolIDResult.reverted) {
    log.info(
      "[getToken0PriceInToken1]WeightedPoolContract ({}) getPoolId() call reverted",
      [poolAddress]
    );
    return null;
  }
  const poolTokensResult = vaultContract.try_getPoolTokens(poolIDResult.value);
  if (poolTokensResult.reverted) {
    log.info(
      "[getToken0PriceInToken1]VaultContract ({}) getPoolTokens() call reverted",
      [poolAddress]
    );
    return null;
  }
  const poolTokenAddrs = poolTokensResult.value.getTokens();
  const poolTokenBalances = poolTokensResult.value.getBalances();
  const token0Idx = poolTokenAddrs.indexOf(Address.fromString(token0));
  const token1Idx = poolTokenAddrs.indexOf(Address.fromString(token1));
  if (token0Idx < 0 || token1Idx < 0) {
    // token0 or token1 not found in poolTokenAddrs, should not happen
    log.error(
      "[getToken0PriceInToken1]token {} or token {} not found in poolTokens [{}]",
      [token0, token1, poolTokenAddrs.toString()]
    );
    return null;
  }
  const token0PriceInToken1 = poolTokenBalances[token1Idx]
    .times(weightsResult.value[token0Idx])
    .divDecimal(
      poolTokenBalances[token0Idx]
        .times(weightsResult.value[token1Idx])
        .toBigDecimal()
    );
  return token0PriceInToken1;
}

// get gOHM price (the price from vesta price feed is off)
export function getgOHMPrice(blockNumber: BigInt): BigDecimal | null {
  const gOHMPriceInWETH = getToken0PriceInToken1UniswapV2(
    SUSHI_gOHM_WETH_PAIR_ADDRESS,
    gOHM_ADDRESS,
    WETH_ADDRESS
  );

  const WETHPriceInUSDC = getToken0PriceInToken1UniswapV2(
    SUSHI_WETH_USDC_PAIR_ADDRESS,
    WETH_ADDRESS,
    USDC_ADDRESS
  );

  if (!gOHMPriceInWETH || !WETHPriceInUSDC) {
    log.warning("[getgOHMPrice]Failed to get OHM price at block {}", [
      blockNumber.toString(),
    ]);
    return null;
  }

  const gOHMPriceInUSD = gOHMPriceInWETH
    .times(WETHPriceInUSDC)
    .times(exponentToBigDecimal(gOHM_DECIMALS - USDC_DECIMALS));

  return gOHMPriceInUSD;
}

// get token price from uniswap forks
function getToken0PriceInToken1UniswapV2(
  pairAddress: string,
  token0: string,
  token1: string
): BigDecimal | null {
  const pairContract = UniswapV2Pair.bind(Address.fromString(pairAddress));
  const reserves = pairContract.try_getReserves();
  if (reserves.reverted) {
    log.error(
      "[getToken0PriceInToken1UniswapV2]Unable to get reserves for pair {}",
      [pairAddress]
    );
    return null;
  }
  let token0Amount: BigInt;
  let token1Amount: BigInt;
  const pairToken0 = pairContract.token0().toHexString();
  const pairToken1 = pairContract.token1().toHexString();
  if (pairToken0 == token0) {
    if (pairToken1 != token1) {
      log.error(
        "[getToken0PriceInToken1UniswapV2]tokens for pair {} = ({}, {}) do not match ({}, {})",
        [pairAddress, pairToken0, pairToken1, token0, token1]
      );
      return null;
    }
    token0Amount = reserves.value.value0;
    token1Amount = reserves.value.value1;
  } else {
    if (pairToken0 != token1 || pairToken1 != token0) {
      log.error(
        "[getToken0PriceInToken1UniswapV2]tokens for pair {} = ({}, {}) do not match ({}, {})",
        [pairAddress, pairToken0, pairToken1, token1, token0]
      );
      return null;
    }
    token0Amount = reserves.value.value1;
    token1Amount = reserves.value.value0;
  }

  const token0PriceInToken1 = token1Amount.divDecimal(
    token0Amount.toBigDecimal()
  );

  return token0PriceInToken1;
}
