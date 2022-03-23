import { Address, BigDecimal } from '@graphprotocol/graph-ts';
import { RewardToken, Token } from '../../generated/schema';
import { ERC20 } from '../../generated/templates/SettVault/ERC20';
import { BadgerSett, Transfer } from '../../generated/VaultRegistry/BadgerSett';
import { DEFAULT_DECIMALS, NULL_ADDRESS } from '../constant';
import { getOrCreateProtocol } from '../entities/Protocol';
import { getOrCreateReward, getOrCreateToken } from '../entities/Token';
import { getOrCreateDeposit, getOrCreateWithdraw } from '../entities/Transaction';
import { getOrCreateUser, getOrCreateUserSnapshot } from '../entities/User';
import { getOrCreateVault } from '../entities/Vault';
import { readValue } from '../utils/contracts';
import { getDay } from '../utils/numbers';
import { updateProtocol, updateUsageMetrics } from './common';

export function handleSettTransfer(event: Transfer): void {
  //note: sett address : event.address
  let metrics = getOrCreateUserSnapshot(getDay(event.block.timestamp));
  let vault = getOrCreateVault(event.address, event.block);
  let protocol = getOrCreateProtocol();
  let token: Token;

  let sett = BadgerSett.bind(event.address);
  let tokenAddress = readValue<Address>(sett.try_token(), NULL_ADDRESS);
  if (!tokenAddress.equals(NULL_ADDRESS)) {
    token = createToken(tokenAddress);
  } else {
    token = createToken(event.address);
  }

  // deposit
  if (event.params.from.equals(NULL_ADDRESS)) {
    let user = getOrCreateUser(event.params.to);
    let deposit = getOrCreateDeposit(event.transaction.hash, event.logIndex);

    deposit.asset = token.id;
    deposit.protocol = protocol.id;
    deposit.to = vault.id;
    deposit.from = user.id;
    deposit.vault = vault.id;
    deposit.amount = event.params.value.toBigDecimal();
    deposit.amountUSD = BigDecimal.zero(); // TODO: calc
    deposit.save();

    updateProtocol(protocol, vault, metrics);
    updateUsageMetrics(user, protocol, metrics, event.block);
  }

  // withdrawal
  if (event.params.to.equals(NULL_ADDRESS)) {
    let user = getOrCreateUser(event.params.from);
    let withdrawal = getOrCreateWithdraw(event.transaction.hash, event.logIndex);

    withdrawal.asset = token.id;
    withdrawal.protocol = protocol.id;
    withdrawal.to = user.id;
    withdrawal.from = vault.id;
    withdrawal.vault = vault.id;
    withdrawal.amount = event.params.value.toBigDecimal();
    withdrawal.amountUSD = BigDecimal.zero(); // TODO: calc
    withdrawal.save();

    updateProtocol(protocol, vault, metrics);
    updateUsageMetrics(user, protocol, metrics, event.block);
  }

  // TODO: 3rd condition, normal transfer, mange financial
}

export function handleTransfer(event: Transfer): void {
  let token = Token.load(event.address.toHex());

  if (!token) {
    createToken(event.address);
  }
}

export function handleReward(event: Transfer): void {
  let token = RewardToken.load(event.address.toHex());

  if (!token) {
    token = createRewardToken(event.address);
  }
}

function createToken(address: Address): Token {
  let token = getOrCreateToken(address);
  let contract = ERC20.bind(address);

  token.name = readValue<string>(contract.try_name(), '');
  token.symbol = readValue<string>(contract.try_symbol(), '');
  token.decimals = readValue<i32>(contract.try_decimals(), DEFAULT_DECIMALS);

  token.save();
  return token;
}

function createRewardToken(address: Address): RewardToken {
  let token = getOrCreateReward(address);
  let contract = ERC20.bind(address);

  token.name = readValue<string>(contract.try_name(), '');
  token.symbol = readValue<string>(contract.try_symbol(), '');
  token.decimals = readValue<i32>(contract.try_decimals(), DEFAULT_DECIMALS);

  token.save();
  return token;
}
