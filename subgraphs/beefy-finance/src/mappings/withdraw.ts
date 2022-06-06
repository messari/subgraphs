import {
  BigDecimal,
  BigInt,
  dataSource,
  ethereum,
} from "@graphprotocol/graph-ts";
import { Vault, Withdraw } from "../../generated/schema";
import {
  BeefyStrategy,
  Withdraw as WithdrawEvent,
} from "../../generated/ExampleVault/BeefyStrategy";
import {
  getBeefyFinanceOrCreate,
  getVaultFromStrategyOrCreate,
  getTokenOrCreate,
} from "../utils/getters";
import { getLastPriceUSD } from "./token";
import { ZERO_ADDRESS_STRING } from "../prices/common/constants";

export function createWithdraw(
  event: WithdrawEvent,
  withdrawnAmount: BigInt,
  networkSuffix: string
): Withdraw {
  const withdraw = new Withdraw(
    event.transaction.hash
      .toHexString()
      .concat(`-${event.transaction.index}`)
      .concat(networkSuffix)
  );

  withdraw.hash = event.transaction.hash.toHexString();
  withdraw.logIndex = event.transaction.index.toI32();
  withdraw.from = event.transaction.from.toHexString();
  const to = event.transaction.to;
  withdraw.to = to ? to.toHexString() : ZERO_ADDRESS_STRING;
  withdraw.blockNumber = event.block.number;
  withdraw.timestamp = event.block.timestamp;

  const strategyContract = BeefyStrategy.bind(event.address);
  withdraw.asset = getTokenOrCreate(strategyContract.want(), networkSuffix).id;
  withdraw.amount = withdrawnAmount;
  withdraw.amountUSD = getLastPriceUSD(
    strategyContract.want(),
    networkSuffix,
    event.block.number
  ).times(new BigDecimal(withdrawnAmount));

  withdraw.vault = getVaultFromStrategyOrCreate(
    event.address,
    event.block,
    networkSuffix
  ).id;
  withdraw.protocol = getBeefyFinanceOrCreate(
    dataSource.network(),
    getVaultFromStrategyOrCreate(event.address, event.block, networkSuffix).id,
    event.block
  ).id;

  withdraw.save();
  return withdraw;
}

export function getOrCreateFirstWithdraw(
  vault: Vault,
  currentBlock: ethereum.Block
): Withdraw {
  let withdraw = Withdraw.load("MockWithdraw" + vault.id);
  if (!withdraw) {
    withdraw = new Withdraw("MockWithdraw" + vault.id);

    withdraw.hash = ZERO_ADDRESS_STRING;
    withdraw.logIndex = 0;
    withdraw.protocol = getBeefyFinanceOrCreate(
      dataSource.network(),
      vault.id,
      currentBlock
    ).id;
    withdraw.from = ZERO_ADDRESS_STRING;
    withdraw.to = ZERO_ADDRESS_STRING;
    withdraw.blockNumber = vault.createdBlockNumber;
    withdraw.timestamp = vault.createdTimestamp;
    withdraw.asset = vault.inputToken;
    withdraw.amount = new BigInt(0);
    withdraw.amountUSD = new BigDecimal(new BigInt(0));
    withdraw.vault = vault.id;

    withdraw.save();
  }
  return withdraw;
}
