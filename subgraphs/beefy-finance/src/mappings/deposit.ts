import { BigInt } from "@graphprotocol/graph-ts";
import { Deposit } from "../../generated/schema";
import {
  BeefyStrategy,
  Deposit as DepositEvent,
} from "../../generated/aave-aave-eol/BeefyStrategy";
import { getTokenOrCreate } from "../utils/getters";
import {
  BIGINT_TEN,
  PROTOCOL_ID,
  ZERO_ADDRESS_STRING,
} from "../prices/common/constants";

export function createDeposit(
  event: DepositEvent,
  depositedAmount: BigInt,
  vaultId: string
): Deposit {
  const deposit = new Deposit(
    event.transaction.hash.toHexString().concat(`-${event.transaction.index}`)
  );

  deposit.hash = event.transaction.hash.toHexString();
  deposit.logIndex = event.transaction.index.toI32();
  deposit.from = event.transaction.from.toHexString();
  const to = event.transaction.to;
  deposit.to = to ? to.toHexString() : ZERO_ADDRESS_STRING;
  deposit.blockNumber = event.block.number;
  deposit.timestamp = event.block.timestamp;

  const strategyContract = BeefyStrategy.bind(event.address);
  const asset = getTokenOrCreate(strategyContract.want(), event.block);
  deposit.asset = asset.id;
  deposit.amount = depositedAmount;
  deposit.amountUSD = asset.lastPriceUSD
    .times(depositedAmount.toBigDecimal())
    .div(BIGINT_TEN.pow(asset.decimals as u8).toBigDecimal());

  deposit.vault = vaultId;

  deposit.protocol = PROTOCOL_ID;

  deposit.save();
  return deposit;
}
