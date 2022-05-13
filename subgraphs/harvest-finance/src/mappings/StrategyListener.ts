import { BigInt,BigDecimal, Address, log , ethereum } from "@graphprotocol/graph-ts"
import {
  ProfitLogInReward as ProfitLogInRewardEvent,
  StrategyContract
} from "../../generated/templates/StrategyListener/StrategyContract"
import { getOrCreateVault} from './../entities/Vault'
import { getOrCreateToken } from './../entities/Token'
import * as constants from "./../constant";
import { getUsdPrice } from "./../Prices";
import { getOrCreateProtocol } from "../entities/Protocol";

function handleProfitAndBuybackLog(event: ProfitLogInRewardEvent): void{
  let profit_amount = event.params.profitAmount;
  let fee_amount = event.params.feeAmount;



  let strategy_addr = event.address;
  let stategy_contract = StrategyContract.bind(strategy_addr);

  //let vault_addr = strategy_contract.try_vault();
  //let vault = getOrCreateVault(vault_addr.toHex());
  let rewardToken_addr = strategy_contract.try_rewardToken();

  let profit_USD = getUsdPrice(rewardToken_addr, profit_amount);

  log.info('profit_amount: '+profit_amount.toString()+' - id este: '+profit_USD.toString()+' $');

  let protocol = getOrCreateProtocol();
  protocol.cumulativeProtocolSideRevenueUSD = protocol.cumulativeProtocolSideRevenueUSD.plus(profit_USD);
  protocol.save();
}


function handleProfitLogInReward(event: ProfitLogInRewardEvent): void{
  let profit_amount = event.params.profitAmount;
  let fee_amount = event.params.feeAmount;



  let strategy_addr = event.address;
  let stategy_contract = StrategyContract.bind(strategy_addr);

  //let vault_addr = strategy_contract.try_vault();
  //let vault = getOrCreateVault(vault_addr.toHex());
  let rewardToken_addr = strategy_contract.try_rewardToken();

  let profit_USD = getUsdPrice(rewardToken_addr, profit_amount);

  log.info('profit_amount: '+profit_amount.toString()+' - id este: '+profit_USD.toString()+' $');

  let protocol = getOrCreateProtocol();
  protocol.cumulativeProtocolSideRevenueUSD = protocol.cumulativeProtocolSideRevenueUSD.plus(profit_USD);
  protocol.save();
}

function handleProfit(event: ethereum.Event): void{
  
}