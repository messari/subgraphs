import { Address, BigDecimal, BigInt, log } from "@graphprotocol/graph-ts";
import { getOrCreateToken } from "../getters";
import { BalancerPoolToken } from "../../../generated/templates/CurveGauge/BalancerPoolToken";
import { BIGDECIMAL_ONE, BIGDECIMAL_ZERO, DEFAULT_DECIMALS } from "../constants";
import { USDT_TOKEN } from "../constants/index";
import { TokenSnapshot } from "../../../generated/schema";
import { createTokenSnapshotID } from "../../services/snapshots";
import { getUsdRate } from "../pricing";
import { bigIntToBigDecimal } from "../utils/numbers";

function getUnderlyingBalance(tokenAddr: Address, bptContract: BalancerPoolToken): BigDecimal {
  const token = getOrCreateToken(tokenAddr);
  const balanceCall = bptContract.try_balanceOf(tokenAddr);
  if (balanceCall.reverted) {
    return BIGDECIMAL_ZERO;
  }
  return bigIntToBigDecimal(balanceCall.value, token.decimals);
}

function getUnderlyingTokenPrice(tokenAddr: Address, timestamp: BigInt): BigDecimal {
  let tokenSnapshot = TokenSnapshot.load(createTokenSnapshotID(tokenAddr, timestamp));
  if (tokenSnapshot) {
    return tokenSnapshot.price;
  }
  tokenSnapshot = new TokenSnapshot(createTokenSnapshotID(tokenAddr, timestamp));
  let priceUSD = getUsdRate(tokenAddr);
  tokenSnapshot.price = priceUSD;
  tokenSnapshot.save();
  return priceUSD;
}

export function isBalancerToken(tokenAddr: Address): boolean {
  let bptContract = BalancerPoolToken.bind(tokenAddr);
  const colorCall = bptContract.try_getColor();
  if (!colorCall.reverted) {
    log.error("Balancer token found {}", [tokenAddr.toHexString()]);
    return true;
  }
  return false;
}

export function getBalancerLpPriceUSD(tokenAddr: Address, timestamp: BigInt): BigDecimal {
  let bptContract = BalancerPoolToken.bind(tokenAddr);
  const underlyingTokensCall = bptContract.try_getCurrentTokens();
  const lpTotalSupplyCall = bptContract.try_totalSupply();
  if (underlyingTokensCall.reverted || lpTotalSupplyCall.reverted) {
    return BIGDECIMAL_ZERO;
  }
  const underlyingTokens = underlyingTokensCall.value;
  const lpTotalSupply = bigIntToBigDecimal(lpTotalSupplyCall.value, DEFAULT_DECIMALS);
  let poolTVL = BIGDECIMAL_ZERO;
  for (let i = 0; i < underlyingTokens.length; i++) {
    let underlyingToken = underlyingTokens[i];
    let underlyingBalance = getUnderlyingBalance(underlyingToken, bptContract); // returns balance in underlying token divided by decimals
    let priceUSD =
      underlyingToken.toHexString() == USDT_TOKEN
        ? BIGDECIMAL_ONE
        : getUnderlyingTokenPrice(underlyingToken, timestamp);
    poolTVL = poolTVL.plus(priceUSD.times(underlyingBalance));
  }
  return poolTVL.div(lpTotalSupply);
}
