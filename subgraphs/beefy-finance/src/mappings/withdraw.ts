import { Withdraw } from "../../generated/schema";
import {
  BeefyVault,
  WithdrawCall,
} from "../../generated/templates/BeefyVault/BeefyVault";
import { getVaultOrCreate } from "../utils/getters";

export function createWithdraw(
  call: WithdrawCall,
  networkSuffix: string
): Withdraw {
  const withdraw = new Withdraw(
    call.transaction.hash
      .toHexString()
      .concat(`-${call.transaction.index}`)
      .concat(networkSuffix)
  );

  withdraw.hash = call.transaction.hash.toHexString();
  withdraw.logIndex = call.transaction.index.toI32();
  withdraw.protocol = "AssignBeefyFinance"; //TODO
  withdraw.to = call.to.toHexString();
  withdraw.from = call.from.toHexString();
  withdraw.blockNumber = call.block.number;
  withdraw.timestamp = call.block.timestamp;

  const vaultContract = BeefyVault.bind(call.to);
  withdraw.asset = vaultContract.want().toHexString();
  withdraw.amount = vaultContract
    .getPricePerFullShare()
    .times(call.inputs._shares);
  //TODO: withdraw.amountUSD
  withdraw.vault = getVaultOrCreate(call.to, networkSuffix).id;

  withdraw.save();
  return withdraw;
}
