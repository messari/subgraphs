import { Token } from "../../generated/schema";
import * as constants from "../common/constants";
import { Pool } from "../sdk/protocols/generic/pool";
import { TokenPricer } from "../sdk/protocols/config";
import { Vault } from "../../generated/UnionVault/Vault";
import { ERC20 } from "../../generated/UnionVault/ERC20";
import { bigIntToBigDecimal } from "../sdk/util/numbers";
import { getUsdPrice, getUsdPricePerToken } from "../prices";
import { VaultV2 } from "../../generated/UnionVault/VaultV2";
import { TokenParams, TokenInitializer } from "../sdk/protocols/generic/tokens";
import { Address, BigDecimal, BigInt, ethereum } from "@graphprotocol/graph-ts";

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

export function updatePoolTVL(pool: Pool): void {
  const poolAddress = Address.fromBytes(pool.getBytesID());
  const vaultContract = Vault.bind(poolAddress);

  let vaultTVL = readValue<BigInt>(
    vaultContract.try_totalUnderlying(),
    constants.BIGINT_ZERO
  );

  if (vaultTVL.equals(constants.BIGINT_ZERO)) {
    const vaultV2Contract = VaultV2.bind(poolAddress);

    vaultTVL = readValue<BigInt>(
      vaultV2Contract.try_totalAssets(),
      constants.BIGINT_ZERO
    );
  }

  pool.setInputTokenBalances([vaultTVL], true);
}

export function updatePoolOutputTokenSupply(pool: Pool): void {
  const contract = ERC20.bind(Address.fromBytes(pool.getBytesID()));

  const outputTokenSupply = readValue<BigInt>(
    contract.try_totalSupply(),
    constants.BIGINT_ZERO
  );

  pool.setOutputTokenSupply(outputTokenSupply);
}

export function getProtocolFee(pool: Pool): BigInt {
  const vaultContract = Vault.bind(Address.fromBytes(pool.getBytesID()));

  const fee = readValue<BigInt>(
    vaultContract.try_platformFee(),
    constants.BIGINT_ZERO
  );

  return fee;
}
