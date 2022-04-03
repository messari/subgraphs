import {
  Vault as VaultStore,
  Deposit as DepositTransaction,
  Token,
} from "../../generated/schema";

import * as utils from "../common/utils";
import * as constants from "../common/constants";
import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { getUsdPriceOfToken, getPriceOfStakedTokens } from "./Price";

export function _Deposit(
  call: ethereum.Call,
  vault: VaultStore,
  _depositAmount: BigInt
): void {

  let id = 'deposit-' + call.transaction.hash.toHexString();
  
  let transaction = DepositTransaction.load(id);
  if (transaction) {
    return 
  }

  transaction = createDepositTransaction(id, call)

  let _totalSupply = vault.outputTokenSupply;
  let _balance = vault.inputTokenBalances[0];

  // calculate shares minted as per the deposit function in vault contract address
  let _sharesMinted = _totalSupply.isZero()
    ? _depositAmount
    : _depositAmount.times(_totalSupply).div(_balance);

  let inputToken = Token.load(vault.inputTokens[0]);
  let inputTokenAddress = Address.fromString(vault.inputTokens[0]);
  let inputTokenDecimals = BigInt.fromI32(10).pow(inputToken!.decimals as u8);
  let inputTokenPrice = getUsdPriceOfToken(
    inputTokenAddress,
  );
  
  vault.totalValueLockedUSD = inputTokenPrice
    .times(vault.inputTokenBalances[0].toBigDecimal())
    .div(inputTokenDecimals.toBigDecimal())

  vault.totalVolumeUSD = vault.totalVolumeUSD.plus(
    inputTokenPrice
      .times(_depositAmount.toBigDecimal())
      .div(inputTokenDecimals.toBigDecimal())
  );
  
  vault.inputTokenBalances = [vault.inputTokenBalances[0].plus(_depositAmount)]
  vault.outputTokenSupply = vault.outputTokenSupply.plus(_sharesMinted);

  vault.outputTokenPriceUSD = getPriceOfStakedTokens(
    Address.fromString(vault.id),
    inputTokenAddress,
    inputTokenDecimals
  ).toBigDecimal();
  
  // update deposit transaction
  transaction.asset = vault.inputTokens[0];
  transaction.amount = _depositAmount;
  transaction.amountUSD = inputTokenPrice
    .times(_depositAmount.toBigDecimal())
    .div(inputTokenDecimals.toBigDecimal())

  transaction.save();
  vault.save();
}


export function createDepositTransaction(
  id: string,
  call: ethereum.Call,
): DepositTransaction {
  let transaction = new DepositTransaction(id);

  transaction.logIndex = call.transaction.index.toI32();
  transaction.to = call.to.toHexString();
  transaction.from = call.transaction.from.toHexString();
  transaction.hash = call.transaction.hash.toHexString();

  transaction.timestamp = utils.getTimestampInMillis(call.block);
  transaction.blockNumber = call.block.number;
  transaction.protocol = constants.ETHEREUM_PROTOCOL_ID;
  transaction.vault = call.to.toHexString();

  return transaction;
}
