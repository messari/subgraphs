import {
  Vault as VaultStore,
  Deposit as DepositTransaction,
  Token,
} from "../../generated/schema";

import * as utils from "../common/utils";
import * as constants from "../common/constants";
import { getUsdPriceOfToken, getPriceOfStakedTokens } from "./Price";
import { Address, BigDecimal, BigInt, ethereum } from "@graphprotocol/graph-ts";

export function _Deposit(
  vault: VaultStore,
  _depositAmount: BigInt
): BigDecimal {
  let _totalSupply = vault.outputTokenSupply;
  let _balance = vault.inputTokenBalances[0];

  let _sharesMinted = _totalSupply.isZero()
    ? _depositAmount
    : _depositAmount.times(_totalSupply).div(_balance);

  vault.outputTokenSupply = vault.outputTokenSupply.plus(
    _sharesMinted
  );
  vault.inputTokenBalances = [
    vault.inputTokenBalances[0].plus(_depositAmount),
  ];
  
  let inputToken = Token.load(vault.inputTokens[0])
  let _decimals = BigInt.fromI32(10).pow(inputToken!.decimals as u8)
  
  let inputTokenAddress = Address.fromString(vault.inputTokens[0]);
  const amountUSD = utils.normalizedUsdcPrice(
    getUsdPriceOfToken(inputTokenAddress, _depositAmount, _decimals)
  );

  vault.totalVolumeUSD = vault.totalVolumeUSD.plus(amountUSD.toBigDecimal());
  vault.totalValueLockedUSD = utils.normalizedUsdcPrice(
    getUsdPriceOfToken(
      inputTokenAddress,
      BigInt.fromString(vault.inputTokenBalances[0].toString()),
      _decimals
    )
  ).toBigDecimal();

  vault.outputTokenPriceUSD = getPriceOfStakedTokens(
    Address.fromString(vault.id),
    inputTokenAddress,
    _decimals
  ).toBigDecimal();
  vault.save();

  return amountUSD.toBigDecimal();
}

export function createDepositTransaction(
  call: ethereum.Call,
  _amount: BigInt,
  _amountUSD: BigDecimal
): DepositTransaction {
  let id = "deposit-" + call.transaction.hash.toHexString();

  let transaction = DepositTransaction.load(id);
  if (transaction == null) {
    transaction = new DepositTransaction(id);
    transaction.logIndex = call.transaction.index.toI32();
    transaction.to = call.to.toHexString();
    transaction.from = call.transaction.from.toHexString();
    transaction.hash = call.transaction.hash.toHexString();

    transaction.timestamp = utils.getTimestampInMillis(call.block);
    transaction.blockNumber = call.block.number;
    transaction.protocol = constants.ETHEREUM_PROTOCOL_ID;
    transaction.vault = call.to.toHexString();

    const vault = VaultStore.load(call.to.toHexString());
    if (vault) {
      transaction.asset = vault.inputTokens[0];
    }
    transaction.amount = _amount;
    transaction.amountUSD = _amountUSD;
    transaction.save();
  }

  return transaction;
}
