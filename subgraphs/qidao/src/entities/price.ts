import {
  Address,
  BigDecimal,
  dataSource,
  ethereum,
  log,
} from "@graphprotocol/graph-ts";
import { erc20QiStablecoin } from "../../generated/templates/Vault/erc20QiStablecoin";
import { QiStablecoinDecimals } from "../../generated/templates/Vault/QiStablecoinDecimals";
import { Token } from "../../generated/schema";
import {
  BIGDECIMAL_ZERO,
  COLLATERAL_PRICE_DECIMALS,
  STAKEDAO_STETH_VAULT,
  YEARN_STETH_VAULT,
} from "../utils/constants";
import { bigIntToBigDecimal } from "../utils/numbers";
import { prefixID } from "../utils/strings";

export function getCollateralPrice(
  event: ethereum.Event,
  marketAddress: Address,
  token: Token
): BigDecimal {
  if (
    token.lastPriceBlockNumber &&
    token.lastPriceBlockNumber!.equals(event.block.number)
  ) {
    return token.lastPriceUSD!;
  }

  // Catch price error in ethereum deployment
  // On block 15542061 in the StakeDao Curve stETh vault the price is $1591.3254437
  if (
    marketAddress == STAKEDAO_STETH_VAULT &&
    event.block.number.toI32() == 15542061
  ) {
    return BigDecimal.fromString("1591.3254437");
  }

  // Catch another price error in the ethereum deployment
  // On block 15542065 in the Yearn Curve stETH vault the price is $1700.24630687
  if (
    marketAddress == YEARN_STETH_VAULT &&
    event.block.number.toI32() == 15542065
  ) {
    return BigDecimal.fromString("1700.24630687");
  }

  const contract = erc20QiStablecoin.bind(marketAddress);
  const priceCall = contract.try_getEthPriceSource();
  if (priceCall.reverted) {
    log.error("Failed to get collateral price for market: {}", [
      marketAddress.toHexString(),
    ]);
    return BIGDECIMAL_ZERO;
  }
  const decimals = getCollateralPriceDecimals(contract);
  if (decimals == -1) {
    log.error("Failed to get collateral price decimals for market: {}", [
      marketAddress.toHexString(),
    ]);
    return BIGDECIMAL_ZERO;
  }
  const price = bigIntToBigDecimal(priceCall.value, decimals);
  token.lastPriceBlockNumber = event.block.number;
  token.lastPriceUSD = price;
  token.save();
  return price;
}

function getCollateralPriceDecimals(contract: erc20QiStablecoin): i32 {
  const id = prefixID(dataSource.network(), contract._address.toHexString());
  if (COLLATERAL_PRICE_DECIMALS.has(id)) {
    return COLLATERAL_PRICE_DECIMALS.get(id);
  }
  const priceSourceDecimals = contract.try_priceSourceDecimals();
  if (!priceSourceDecimals.reverted) {
    return priceSourceDecimals.value;
  }
  const decimalsFunctions = QiStablecoinDecimals.bind(contract._address);
  const priceSourceDecimalsU256 = decimalsFunctions.try_priceSourceDecimals();
  if (!priceSourceDecimalsU256.reverted) {
    return priceSourceDecimalsU256.value.toI32();
  }
  const collateralDecimals = decimalsFunctions.try_collateralDecimals();
  if (!collateralDecimals.reverted) {
    return collateralDecimals.value.toI32();
  }
  return -1;
}
