import { BigDecimal, Address } from "@graphprotocol/graph-ts";
import { ethereum } from "@graphprotocol/graph-ts/chain/ethereum";
import { Strategy } from "../../generated/schema";
import {
  BeefyStrategy,
  Deposit,
  Deposit__Params,
  Withdraw,
} from "../../generated/ExampleStrategy/BeefyStrategy";
import {
  getBeefyFinanceOrCreate,
  getStrategyOrCreate,
  getVaultOrCreate,
} from "../utils/getters";
import { BeefyVault } from "../../generated/templates/BeefyVault/BeefyVault";
import { getAddressFromId } from "../utils/helpers";
import { createDeposit, getOrCreateFirstDeposit } from "./deposit";
import { createWithdraw, getOrCreateFirstWithdraw } from "./withdraw";

const NETWORK_SUFFIX: string = "-137";

export function createStrategy(
  strategyAddress: Address,
  currentBlock: ethereum.Block
): Strategy {
  const strategy = new Strategy(strategyAddress.toHexString() + NETWORK_SUFFIX);
  const strategyContract = BeefyStrategy.bind(strategyAddress);

  strategy.protocol = getBeefyFinanceOrCreate().id;
  strategy.createdTimestamp = currentBlock.timestamp;
  strategy.createdBlockNumber = currentBlock.number;

  /* const vault = getVaultOrCreate(
    strategyContract.vault(),
    currentBlock,
    NETWORK_SUFFIX
  );
  strategy.vault = vault.id; */
  //strategy.totalValueLockedUSD = new BigDecimal(new BigInt(0));
  //strategy.vault = "Vault";
  strategy.inputTokenBalance = strategyContract.balanceOf();
  //strategy.outputTokenSupply = vault.outputTokenSupply;

  strategy.deposits = [getOrCreateFirstDeposit(strategy).id];
  strategy.withdraws = [getOrCreateFirstWithdraw(strategy).id];

  strategy.save();
  return strategy;
}

export function handleDeposit(event: Deposit): void {
  const strategy = getStrategyOrCreate(
    event.address,
    event.block,
    NETWORK_SUFFIX
  );
  //const strategyContract = BeefyStrategy.bind(event.address);
  /* const vault = getVaultOrCreate(
    getAddressFromId(strategy.vault),
    event.block,
    NETWORK_SUFFIX
  ); */
  //const vaultContract = BeefyVault.bind(getAddressFromId(strategy.vault));
  const depositedAmount = event.params.tvl.minus(strategy.inputTokenBalance);

  strategy.inputTokenBalance = event.params.tvl;

  //vault.inputTokenBalance = vaultContract.balance();
  //vault.outputTokenSupply = vaultContract.totalSupply();
  //strategy.outputTokenSupply = vault.outputTokenSupply;
  //vault.pricePerShare = new BigDecimal(vaultContract.getPricePerFullShare());

  const deposit = createDeposit(event, depositedAmount, NETWORK_SUFFIX);

  if (strategy.deposits[0] === "MockDeposit") {
    strategy.deposits = [deposit.id];
  } else {
    strategy.deposits.push(deposit.id);
  }
  //vault.deposits.push(deposit.id);

  strategy.save();
  //vault.save();
}

export function handleWithdraw(event: Withdraw): void {
  const strategy = getStrategyOrCreate(
    event.address,
    event.block,
    NETWORK_SUFFIX
  );
  //const strategyContract = BeefyStrategy.bind(event.address);
  /* const vault = getVaultOrCreate(
    getAddressFromId(strategy.vault),
    event.block,
    NETWORK_SUFFIX
  );
  const vaultContract = BeefyVault.bind(getAddressFromId(strategy.vault));
   */ const withdrawnAmount = strategy.inputTokenBalance.minus(
    event.params.tvl
  );

  strategy.inputTokenBalance = event.params.tvl;

  /* vault.inputTokenBalance = vaultContract.balance();
  vault.outputTokenSupply = vaultContract.totalSupply();
  strategy.outputTokenSupply = vault.outputTokenSupply;
  vault.pricePerShare = new BigDecimal(vaultContract.getPricePerFullShare());
 */
  const withdraw = createWithdraw(event, withdrawnAmount, NETWORK_SUFFIX);

  if (strategy.withdraws[0] === "MockWithdraw") {
    strategy.withdraws = [withdraw.id];
  } else {
    strategy.withdraws.push(withdraw.id);
  }
  //vault.withdraws.push(withdraw.id);

  strategy.save();
  //vault.save();
}

/* import { Strategy } from "../../generated/schema";
import {
  Deposit,
  StratHarvest,
  Withdraw,
} from "../../generated/templates/Strategy/Strategy";
import { getStrategyOrCreate, getVaultOrCreate } from "../utils/getters";
import { getAddressFromId } from "../utils/helpers";

const NETWORK_SUFFIX = "-137";

export async function createStrategy(strategyAddress: string, block: any) {
  const strategy = new Strategy(strategyAddress + NETWORK_SUFFIX);

  strategy.protocol = "Assign BeefyFinance"; //type YieldAggregator
  strategy.createdTimestamp = block.timestamp;
  strategy.createdBlockNumber = block.number;

  strategy.vault = ;

  strategy.save();
}

export async function handleDeposit(event: Deposit): Promise<void> {
  const strategy = getStrategyOrCreate(
    event.address.toHexString(),
    NETWORK_SUFFIX
  );

  await updateBalance(strategy);
}

//TODO: handle deposit and withdraw could be collapsed into one function
export async function handleWithdraw(event: Withdraw): Promise<void> {
  const strategy = getStrategyOrCreate(
    event.address.toHexString(),
    NETWORK_SUFFIX
  );

  await updateBalance(strategy);
}

export async function handleStratHarvest(event: StratHarvest): Promise<void> {
  const strategy = getStrategyOrCreate(
    event.address.toHexString(),
    NETWORK_SUFFIX
  );

  await updateBalance(strategy);
}

export async function updateBalance(strategy: Strategy): Promise<void> {
  const strategyContract = new ethers.Contract(
    strategy.id.split("-")[0],
    strategyABI
  );
  strategy.inputTokenBalance = await strategyContract.balanceOf();

  const vault = getVaultOrCreate(
    strategy.vault.split("-")[0],
    "-" + strategy.vault.split("-")[1]
  );
  const vaultContract = new ethers.Contract(
    getAddressFromId(strategy.vault),
    vaultABI
  );
  vault.inputTokenBalance = await vaultContract.balance();
  vault.totalValueLockedUSD = (await vaultContract.pricePerFullShare()).mul(
    await vaultContract.totalSupply()
  );
  strategy.totalValueLockedUSD = (await strategyContract.balanceOf())
    .mul(vault.totalValueLockedUSD)
    .div(await vaultContract.balance());

  strategy.save();
  vault.save();
}
 */
