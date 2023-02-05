import * as utils from "../common/utils";
import { Token } from "../../generated/schema";
import * as constants from "../common/constants";
import { Vault } from "../../generated/templates/Vault/Vault";
import { BigInt, Address, BigDecimal } from "@graphprotocol/graph-ts";

export function getPriceOfOutputTokens(
  vaultAddress: Address,
  inputToken: Token
): BigDecimal {
  const vaultContract = Vault.bind(vaultAddress);

  const pricePerShare = utils
    .readValue<BigInt>(
      vaultContract.try_getPricePerFullShare(),
      constants.BIGINT_TEN.pow(constants.DEFAULT_DECIMALS.toI32() as u8)
    )
    .toBigDecimal();

  return inputToken
    .lastPriceUSD!.times(pricePerShare)
    .div(
      constants.BIGINT_TEN.pow(
        constants.DEFAULT_DECIMALS.toI32() as u8
      ).toBigDecimal()
    );
}
