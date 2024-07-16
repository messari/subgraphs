import { Token } from "../../generated/schema";
import * as constants from "../common/constants";
import { Pool } from "../sdk/protocols/generic/pool";
import { TokenPricer } from "../sdk/protocols/config";
import { ERC20 } from "../../generated/LybraV1/ERC20";
import { bigIntToBigDecimal } from "../sdk/util/numbers";
import { LybraV1 } from "../../generated/LybraV1/LybraV1";
import { getUsdPrice, getUsdPricePerToken } from "../prices";
import { LybraV2 } from "../../generated/LybraStETHVault/LybraV2";
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

    return getUsdPricePerToken(pricedToken).usdPrice;
  }

  getAmountValueUSD(token: Token, amount: BigInt): BigDecimal {
    const pricedToken = Address.fromBytes(token.id);
    const _amount = bigIntToBigDecimal(amount, token.decimals);

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

export function updateV1PoolTVL(pool: Pool): void {
  const poolContract = LybraV1.bind(Address.fromBytes(pool.getBytesID()));

  const poolTVL = readValue<BigInt>(
    poolContract.try_totalDepositedEther(),
    constants.BIGINT_ZERO
  );

  pool.setInputTokenBalances([poolTVL], true);
}

export function updateV2PoolTVL(pool: Pool): void {
  const poolContract = LybraV2.bind(Address.fromBytes(pool.getBytesID()));

  const poolTVL = readValue<BigInt>(
    poolContract.try_totalDepositedAsset(),
    constants.BIGINT_ZERO
  );

  pool.setInputTokenBalances([poolTVL], true);
}

export function updatePoolOutputTokenSupply(pool: Pool): void {
  const contract = ERC20.bind(Address.fromBytes(pool.getBytesID()));

  const outputTokenSupply = readValue<BigInt>(
    contract.try_totalSupply(),
    constants.BIGINT_ZERO
  );

  pool.setOutputTokenSupply(outputTokenSupply);
}
