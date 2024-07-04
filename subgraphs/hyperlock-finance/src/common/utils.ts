import { SDK } from "../sdk/protocols/generic";
import { Token } from "../../generated/schema";
import * as constants from "../common/constants";
import { Pool } from "../sdk/protocols/generic/pool";
import { TokenPricer } from "../sdk/protocols/config";
import { bigIntToBigDecimal } from "../sdk/util/numbers";
import { getUsdPrice, getUsdPricePerToken } from "../prices";
import { ERC20 } from "../../generated/ERC20PointsDeposit/ERC20";
import { ThrusterV2 } from "../../generated/ERC20PointsDeposit/ThrusterV2";
import { Address, BigDecimal, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { TokenParams, TokenInitializer } from "../sdk/protocols/generic/tokens";

export function readValue<T>(
  callResult: ethereum.CallResult<T>,
  defaultValue: T
): T {
  return callResult.reverted ? defaultValue : callResult.value;
}

export class Pricer implements TokenPricer {
  getTokenPrice(token: Token): BigDecimal {
    const pricedToken = Address.fromBytes(token.id);

    const pairContract = ThrusterV2.bind(Address.fromBytes(token.id));
    const factoryCall = pairContract.try_factory();
    if (!factoryCall.reverted) {
      return token.lastPriceUSD
        ? token.lastPriceUSD!
        : constants.BIGDECIMAL_ZERO;
    }

    return getUsdPricePerToken(pricedToken).usdPrice;
  }

  getAmountValueUSD(token: Token, amount: BigInt): BigDecimal {
    const pricedToken = Address.fromBytes(token.id);
    const _amount = bigIntToBigDecimal(amount, token.decimals);

    const pairContract = ThrusterV2.bind(Address.fromBytes(token.id));
    const factoryCall = pairContract.try_factory();
    if (!factoryCall.reverted) {
      return token.lastPriceUSD
        ? token.lastPriceUSD!.times(_amount)
        : constants.BIGDECIMAL_ZERO;
    }

    return getUsdPrice(pricedToken, _amount);
  }
}

export class TokenInit implements TokenInitializer {
  getTokenParams(address: Address): TokenParams {
    const contract = ERC20.bind(address);
    let default_name = "unknown";
    let default_symbol = "UNKNOWN";
    let default_decimals = constants.INT_ZERO as i32;

    if (address == Address.fromString(constants.ETH_ADDRESS)) {
      default_name = constants.ETH_NAME;
      default_symbol = constants.ETH_SYMBOL;
      default_decimals = constants.DEFAULT_DECIMALS as i32;
    }

    const name = readValue<string>(contract.try_name(), default_name);
    const symbol = readValue<string>(contract.try_symbol(), default_symbol);
    const decimals = readValue<i32>(contract.try_decimals(), default_decimals);

    return new TokenParams(name, symbol, decimals);
  }
}

export function updateV2PoolsLpTokenPrice(pool: Pool, sdk: SDK): void {
  const token0 = pool.getInputToken(constants.INT_ZERO);
  const token1 = pool.getInputToken(constants.INT_ONE);

  const pairContract = ThrusterV2.bind(Address.fromBytes(pool.getBytesID()));
  let reserve0 = constants.BIGINT_ZERO;
  let reserve1 = constants.BIGINT_ZERO;
  const reservesCall = pairContract.try_getReserves();
  if (!reservesCall.reverted) {
    reserve0 = reservesCall.value.get_reserve0();
    reserve1 = reservesCall.value.get_reserve1();
  }

  let decimals = constants.DEFAULT_DECIMALS;
  const decimalsCall = pairContract.try_decimals();
  if (!decimalsCall.reverted) {
    decimals = decimalsCall.value;
  }

  let totalSupply = constants.BIGINT_ZERO;
  const totalSupplyCall = pairContract.try_totalSupply();
  if (!totalSupplyCall.reverted) {
    totalSupply = totalSupplyCall.value;
  }

  const token0Usd = getUsdPrice(
    Address.fromBytes(token0.id),
    bigIntToBigDecimal(reserve0, token0.decimals)
  );
  const token1Usd = getUsdPrice(
    Address.fromBytes(token1.id),
    bigIntToBigDecimal(reserve1, token1.decimals)
  );
  const lpTokenUsd = token0Usd
    .plus(token1Usd)
    .div(bigIntToBigDecimal(totalSupply, decimals));

  const lpToken = sdk.Tokens.getOrCreateToken(
    Address.fromBytes(pool.getBytesID())
  );
  lpToken.lastPriceUSD = lpTokenUsd;
  lpToken.save();
}
