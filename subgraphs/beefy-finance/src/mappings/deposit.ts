import { Deposit } from "../../generated/schema";
import {
  BeefyVault,
  DepositCall,
} from "../../generated/templates/BeefyVault/BeefyVault";
import { getVaultOrCreate } from "../utils/getters";

export function createDeposit(
  call: DepositCall,
  networkSuffix: string
): Deposit {
  const deposit = new Deposit(
    call.transaction.hash
      .toHexString()
      .concat(`-${call.transaction.index}`)
      .concat(networkSuffix)
  );

  deposit.hash = call.transaction.hash.toHexString();
  deposit.logIndex = call.transaction.index.toI32();
  deposit.protocol = "AssignBeefyFinance"; //TODO
  deposit.to = call.to.toHexString();
  deposit.from = call.from.toHexString();
  deposit.blockNumber = call.block.number;
  deposit.timestamp = call.block.timestamp;

  const vaultContract = BeefyVault.bind(call.to);
  deposit.asset = vaultContract.want().toHexString();
  deposit.amount = call.inputs._amount;
  //TODO: deposit.amountUSD
  deposit.vault = getVaultOrCreate(call.to, networkSuffix).id;

  deposit.save();
  return deposit;
}
