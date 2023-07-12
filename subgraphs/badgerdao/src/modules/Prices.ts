import * as utils from "../common/utils";
import * as constants from "../common/constants";
import { getOrCreateToken } from "../common/initializers";
import { BigInt, Address, BigDecimal, ethereum } from "@graphprotocol/graph-ts";
import { Vault as VaultContract } from "../../generated/templates/Strategy/Vault";

export function getPricePerShare(vaultAddress: Address): BigDecimal {
  const vaultContract = VaultContract.bind(vaultAddress);

  const pricePerShare = utils
    .readValue<BigInt>(
      vaultContract.try_getPricePerFullShare(),
      constants.BIGINT_ZERO
    )
    .toBigDecimal();

  return pricePerShare;
}

export function getPriceOfOutputTokens(
  vaultAddress: Address,
  amount: BigDecimal,
  block: ethereum.Block
): BigDecimal {
  const vaultContract = VaultContract.bind(vaultAddress);

  const tokenAddress = utils.readValue<Address>(
    vaultContract.try_token(),
    constants.NULL.TYPE_ADDRESS
  );

  const token = getOrCreateToken(tokenAddress, block);
  const pricePerShare = getPricePerShare(vaultAddress);
  const vaultTokenDecimals = utils.getTokenDecimals(vaultAddress);

  const price = pricePerShare
    .times(amount)
    .div(vaultTokenDecimals)
    .div(vaultTokenDecimals)
    .times(token.lastPriceUSD!);

  return price;
}
