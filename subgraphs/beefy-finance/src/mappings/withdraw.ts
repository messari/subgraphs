import { BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { Withdraw } from "../../generated/schema";
import {
  BeefyStrategy,
  Withdraw as WithdrawEvent,
} from "../../generated/Standard/BeefyStrategy";
import { getTokenOrCreate } from "../utils/getters";
import {
  BIGINT_TEN,
  PROTOCOL_ID,
  ZERO_ADDRESS_STRING,
} from "../prices/common/constants";

export function createWithdraw(
  event: WithdrawEvent,
  withdrawnAmount: BigInt,
  vaultId: string
): Withdraw {
  const withdraw = new Withdraw(
    event.transaction.hash.toHexString().concat(`-${event.transaction.index}`)
  );

  withdraw.hash = event.transaction.hash.toHexString();
  withdraw.logIndex = event.transaction.index.toI32();
  withdraw.from = event.transaction.from.toHexString();
  const to = event.transaction.to;
  withdraw.to = to ? to.toHexString() : ZERO_ADDRESS_STRING;
  withdraw.blockNumber = event.block.number;
  withdraw.timestamp = event.block.timestamp;

  const strategyContract = BeefyStrategy.bind(event.address);
  const asset = getTokenOrCreate(strategyContract.want(), event.block);
  withdraw.asset = asset.id;
  withdraw.amount = withdrawnAmount;
  withdraw.amountUSD = asset.lastPriceUSD
    .times(new BigDecimal(withdrawnAmount))
    .div(new BigDecimal(BIGINT_TEN.pow(asset.decimals as u8)));

  withdraw.vault = vaultId;
  withdraw.protocol = PROTOCOL_ID;

  withdraw.save();
  return withdraw;
}
