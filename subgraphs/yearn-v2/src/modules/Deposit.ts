import * as utils from "../common/utils";
import { getUsdPricePerToken } from "../Prices";
import { getPriceOfStakedTokens } from "./Price";
import * as constants from "../common/constants";
import {
  Token,
  Vault as VaultStore,
  Deposit as DepositTransaction,
} from "../../generated/schema";
import { Address, BigInt, ethereum, log } from "@graphprotocol/graph-ts";
import { Vault as VaultContract } from "../../generated/Registry_v1/Vault";

export function createDepositTransaction(
  id: string,
  call: ethereum.Call
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

export function calculateAmountDeposited(
  vaultAddress: Address,
  sharesMinted: BigInt
): BigInt {
  let vaultContract = VaultContract.bind(vaultAddress);
  let totalAssets = utils.readValue<BigInt>(
    vaultContract.try_totalAssets(),
    constants.BIGINT_ZERO
  );
  let totalSupply = utils.readValue<BigInt>(
    vaultContract.try_totalSupply(),
    constants.BIGINT_ZERO
  );

  let amount = totalSupply.isZero()
    ? constants.BIGINT_ZERO
    : sharesMinted.times(totalAssets).div(totalSupply);

  return amount;
}

export function _Deposit(
  call: ethereum.Call,
  vault: VaultStore,
  _sharesMinted: BigInt,
  _depositAmount: BigInt | null = null
): void {
  let id = "deposit-" + call.transaction.hash.toHexString();

  let transaction = DepositTransaction.load(id);
  if (transaction) {
    return;
  }

  if (!_depositAmount) {
    _depositAmount = calculateAmountDeposited(
      Address.fromString(vault.id),
      _sharesMinted
    );
  }

  transaction = createDepositTransaction(id, call);

  let inputToken = Token.load(vault.inputTokens[0]);
  let inputTokenAddress = Address.fromString(vault.inputTokens[0]);
  let inputTokenDecimals = BigInt.fromI32(10).pow(inputToken!.decimals as u8);
  let inputTokenPrice = getUsdPricePerToken(inputTokenAddress);

  vault.totalValueLockedUSD = inputTokenPrice.usdPrice
    .times(vault.inputTokenBalances[0].toBigDecimal())
    .div(inputTokenDecimals.toBigDecimal());

  vault.totalVolumeUSD = vault.totalVolumeUSD.plus(
    inputTokenPrice.usdPrice
      .times(_depositAmount.toBigDecimal())
      .div(inputTokenDecimals.toBigDecimal())
  );

  vault.inputTokenBalances = [vault.inputTokenBalances[0].plus(_depositAmount)];
  vault.outputTokenSupply = vault.outputTokenSupply.plus(_sharesMinted);

  vault.outputTokenPriceUSD = getPriceOfStakedTokens(
    Address.fromString(vault.id),
    inputTokenAddress,
    inputTokenDecimals.toBigDecimal()
  );

  // update deposit transaction
  transaction.asset = vault.inputTokens[0];
  transaction.amount = _depositAmount;
  transaction.amountUSD = inputTokenPrice.usdPrice
    .times(_depositAmount.toBigDecimal())
    .div(inputTokenDecimals.toBigDecimal());

  transaction.save();
  vault.save();

  log.info(
    "[Deposit] TxHash: {}, vaultAddress: {}, _sharesMinted: {}, _depositAmount: {}",
    [call.transaction.hash.toHexString(), vault.id, _sharesMinted.toString(), _depositAmount.toString()]
  );
}
