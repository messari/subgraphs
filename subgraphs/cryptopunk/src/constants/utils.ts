import { cryptopunkContract } from "../../generated/cryptopunkContract/cryptopunkContract";
import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import * as constants from "./constants";

export function getStrategy(punkIndex: BigInt, buyer: Address): string {
  let contract = cryptopunkContract.bind(
    Address.fromString(constants.CRYPTOPUNK_CONTRACT_ADDRESS)
  );
  return contract.try_punksOfferedForSale(punkIndex).value.value4.equals(buyer)
    ? constants.SaleStrategy.PRIVATE_SALE
    : constants.SaleStrategy.STANDARD_SALE;
}

export function getSellerAddressFromPunksOfferedForSale(
  punkIndex: BigInt
): Address {
  let contract = cryptopunkContract.bind(
    Address.fromString(constants.CRYPTOPUNK_CONTRACT_ADDRESS)
  );
  return contract.try_punksOfferedForSale(punkIndex).value.value2;
}
export function getHighestBiddersAddress(punkIndex: BigInt): Address {
  let contract = cryptopunkContract.bind(
    Address.fromString(constants.CRYPTOPUNK_CONTRACT_ADDRESS)
  );
  return contract.try_punkIndexToAddress(punkIndex).value;
}

export function min(a: BigDecimal, b: BigDecimal): BigDecimal {
  return a < b ? a : b;
}

export function max(a: BigDecimal, b: BigDecimal): BigDecimal {
  return a > b ? a : b;
}
