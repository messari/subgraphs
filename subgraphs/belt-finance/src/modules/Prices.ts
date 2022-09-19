import {
  BigInt,
  Address,
  ethereum,
  BigDecimal,
  dataSource,
} from "@graphprotocol/graph-ts";
import * as utils from "../common/utils";
import * as constants from "../common/constants";
import { getOrCreateToken } from "../common/initializers";
import { Vault as VaultContract } from "../../generated/templates/Strategy/Vault";

export function getPricePerShare(vaultAddress: Address): BigInt {
  const vaultContract = VaultContract.bind(vaultAddress);

  let pricePerShare = utils.readValue<BigInt>(
    vaultContract.try_getPricePerFullShare(),
    constants.BIGINT_ZERO
  );

  return pricePerShare;
}

export function getPriceOfOutputTokens(
  vaultAddress: Address,
  block: ethereum.Block
): BigDecimal {
  const network = dataSource.network();
  const vaultContract = VaultContract.bind(vaultAddress);

  const pricePerShare = getPricePerShare(vaultAddress);

  const tokenAddress = utils.readValue<Address>(
    vaultContract.try_token(),
    constants.NULL.TYPE_ADDRESS
  );

  let token = getOrCreateToken(tokenAddress, block);

  let price = pricePerShare
    .divDecimal(constants.BIGINT_TEN.pow(token.decimals as u8).toBigDecimal())
    .times(token.lastPriceUSD!);

  return price;
}
