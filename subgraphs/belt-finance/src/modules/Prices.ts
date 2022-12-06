import {
  getOrCreateVault,
  getOrCreateTokenFromString,
} from "../common/initializers";
import * as utils from "../common/utils";
import * as constants from "../common/constants";
import { BigInt, Address, ethereum, BigDecimal } from "@graphprotocol/graph-ts";
import { Vault as VaultContract } from "../../generated/templates/Strategy/Vault";

export function getPricePerShare(vaultAddress: Address): BigInt {
  const vaultContract = VaultContract.bind(vaultAddress);

  const pricePerShare = utils.readValue<BigInt>(
    vaultContract.try_getPricePerFullShare(),
    constants.BIGINT_ZERO
  );

  return pricePerShare;
}

export function getPriceOfOutputTokens(
  vaultAddress: Address,
  block: ethereum.Block
): BigDecimal {
  const vault = getOrCreateVault(vaultAddress, block);
  const inputToken = getOrCreateTokenFromString(vault.inputToken, block);

  const outputTokenPrice = vault
    .pricePerShare!.div(
      constants.BIGINT_TEN.pow(inputToken.decimals as u8).toBigDecimal()
    )
    .times(inputToken.lastPriceUSD!);

  return outputTokenPrice;
}
