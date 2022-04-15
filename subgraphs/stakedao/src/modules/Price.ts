import * as utils from "../common/utils";
import * as constants from "../common/constants";
import { Address, BigInt} from "@graphprotocol/graph-ts";
import { getVirtualPrice } from "../Prices/routers/CurveRouter";
import { Vault } from "../../generated/templates/Vault/Vault";

export function getPriceOfStakedTokens(
  vaultAddress: Address,
  tokenAddress: Address,
  _decimals: BigInt
): BigInt {
  const vaultContract = Vault.bind(vaultAddress);

  let pricePerShare = utils.readValue<BigInt>(
    vaultContract.try_getPricePerFullShare(),
    constants.BIGINT_ZERO
  );
  
  let virtualPrice = BigInt.fromString(getVirtualPrice(tokenAddress).toString()).div(_decimals);
  return pricePerShare.div(_decimals).times(virtualPrice);
}
