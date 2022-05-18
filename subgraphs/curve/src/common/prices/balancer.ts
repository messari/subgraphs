import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { getOrCreateToken } from "../getters";
import { BalancerPoolToken } from "../../../generated/templates/CurveGauge/BalancerPoolToken";
import { BIGDECIMAL_ONE, BIGDECIMAL_ZERO, DEFAULT_DECIMALS } from "../constants";
import { USDT_TOKEN } from "../constants/index";
import { bigIntToBigDecimal } from "../utils/numbers";
import { getUnderlyingTokenPrice } from "./underlying";
import { TokenSnapshot } from "../../../generated/schema";
import { createTokenSnapshotID } from "../../services/snapshots";

export function isBalancerToken(tokenAddr: Address): boolean {
  let bptContract = BalancerPoolToken.bind(tokenAddr);
  const colorCall = bptContract.try_getColor();
  if (!colorCall.reverted) {
    return true;
  }
  return false;
}

function getUnderlyingBalance(tokenAddr: Address, bptContract: BalancerPoolToken): BigDecimal {
  const token = getOrCreateToken(tokenAddr);
  const balanceCall = bptContract.try_getBalance(tokenAddr);
  if (balanceCall.reverted) {
    return BIGDECIMAL_ZERO;
  }
  return bigIntToBigDecimal(balanceCall.value, token.decimals);
}

export function getBalancerLpPriceUSD(tokenAddr: Address, timestamp: BigInt): BigDecimal {
  let tokenSnapshot = TokenSnapshot.load(createTokenSnapshotID(tokenAddr, timestamp));
  if (tokenSnapshot) {
    return tokenSnapshot.price;
  }
  tokenSnapshot = new TokenSnapshot(createTokenSnapshotID(tokenAddr, timestamp));
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
  const priceUSD = poolTVL.div(lpTotalSupply);
  tokenSnapshot.price = priceUSD
  return priceUSD
}
