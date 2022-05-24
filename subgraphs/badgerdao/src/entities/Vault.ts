import { Address, BigDecimal, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { Controller } from "../../generated/bBadger/Controller";
import { Strategy as StrategyContract } from "../../generated/bBadger/Strategy";
import { VaultV2 as VaultV2Contract } from "../../generated/bBadger/VaultV2";
import { VaultV4 as VaultContract } from "../../generated/bBadger/VaultV4";
import { Vault, VaultFee, _Strategy } from "../../generated/schema";
import { Strategy as StrategyTemplate } from "../../generated/templates";
import {
    BIGDECIMAL_HUNDRED,
    BIGDECIMAL_ZERO,
    BIGINT_ZERO,
    MAX_FEE,
    NULL_ADDRESS,
    VaultFeeType
} from "../constant";
import { readValue } from "../utils/contracts";
import { enumToPrefix } from "../utils/strings";
import { getOrCreateProtocol } from "./Protocol";
import { getOrCreateToken } from "./Token";

export function getOrCreateVault(id: Address, block: ethereum.Block): Vault {
  let vault = Vault.load(id.toHex());
  let protocol = getOrCreateProtocol();

  if (vault) {
    return vault;
  }

  vault = new Vault(id.toHex());

  vault.protocol = protocol.id;
  vault.name = "";
  vault.symbol = "";
  vault.inputToken = "";
  vault.outputToken = "";
  vault.rewardTokens = [];
  vault.depositLimit = BIGINT_ZERO;
  vault.fees = [];
  vault.createdTimestamp = block.timestamp;
  vault.createdBlockNumber = block.number;
  vault.totalValueLockedUSD = BIGDECIMAL_ZERO;
  vault.inputTokenBalance = BIGINT_ZERO;
  vault.outputTokenSupply = BIGINT_ZERO;
  vault.outputTokenPriceUSD = BIGDECIMAL_ZERO;
  vault.pricePerShare = BIGDECIMAL_ZERO;
  vault.stakedOutputTokenAmount = BIGINT_ZERO;
  vault.rewardTokenEmissionsAmount = [];
  vault.rewardTokenEmissionsUSD = [];
  vault.save();

  // storing vault ids
  let vaultIds = protocol._vaultIds;
  vaultIds.push(vault.id);

  protocol._vaultIds = vaultIds;
  protocol.save();

  return vault;
}

export function createVault(call: ethereum.Call, vaultAddress: Address): Vault {
  let protocol = getOrCreateProtocol();
  let vault = getOrCreateVault(vaultAddress, call.block);
  let vaultContract = VaultContract.bind(vaultAddress);

  vault.name = readValue<string>(vaultContract.try_name(), "");
  vault.symbol = readValue<string>(vaultContract.try_symbol(), "");
  vault.protocol = protocol.id;

  let inputTokenAddress = readValue<Address>(vaultContract.try_token(), NULL_ADDRESS);
  let inputToken = getOrCreateToken(inputTokenAddress);
  vault.inputToken = inputToken.id;
  vault.inputTokenBalance = BIGINT_ZERO;

  let outputToken = getOrCreateToken(vaultAddress);
  vault.outputToken = outputToken.id;
  vault.outputTokenSupply = BIGINT_ZERO;
  vault.save();

  let controllerAddress = readValue<Address>(vaultContract.try_controller(), NULL_ADDRESS);
  let controllerContract = Controller.bind(controllerAddress);
  let strategyAddress = readValue<Address>(
    controllerContract.try_strategies(inputTokenAddress),
    NULL_ADDRESS,
  );

  if (strategyAddress.notEqual(NULL_ADDRESS)) {
    let strategy = new _Strategy(strategyAddress.toHex());
    strategy.vault = vault.id;
    strategy.token = inputToken.id;
    strategy.save();

    let strategyContract = StrategyContract.bind(strategyAddress);

    let performanceFeeId = enumToPrefix(VaultFeeType.PERFORMANCE_FEE).concat(vaultAddress.toHex());
    let performanceFee = readValue<BigInt>(
      strategyContract.try_performanceFeeGovernance(),
      BIGINT_ZERO,
    );
    createFeeType(performanceFeeId, performanceFee.toBigDecimal(), VaultFeeType.PERFORMANCE_FEE);

    let withdrawFeeId = enumToPrefix(VaultFeeType.WITHDRAWAL_FEE).concat(vaultAddress.toHex());
    let withdrawFee = readValue<BigInt>(strategyContract.try_withdrawalFee(), BIGINT_ZERO);
    createFeeType(withdrawFeeId, withdrawFee.toBigDecimal(), VaultFeeType.WITHDRAWAL_FEE);

    vault.fees = [withdrawFeeId, performanceFeeId];
    vault.save();

    StrategyTemplate.create(strategyAddress);
  }

  return vault;
}

export function getFeePercentage(vault: Vault, feeType: string): BigDecimal {
  for (let i = 0; i < vault.fees.length; i++) {
    let feeId = vault.fees[i];
    let fee = VaultFee.load(feeId);

    if (fee && fee.feeType == feeType) {
      return fee.feePercentage || BIGDECIMAL_ZERO;
    }
  }

  return BIGDECIMAL_ZERO;
}

function createFeeType(id: string, feePercentage: BigDecimal, feeType: string): void {
  let fee = new VaultFee(id);

  fee.feePercentage = feePercentage.div(MAX_FEE).times(BIGDECIMAL_HUNDRED);
  fee.feeType = feeType;
  fee.save();
}

export function getPricePerShare(vaultAddress: Address): BigInt {
  let vaultV4Contract = VaultContract.bind(vaultAddress);
  let value = readValue<BigInt>(vaultV4Contract.try_getPricePerFullShare(), BIGINT_ZERO);

  if (value.isZero()) {
    let vaultV2Contract = VaultV2Contract.bind(vaultAddress);
    value = readValue<BigInt>(vaultV2Contract.try_pricePerShare(), BIGINT_ZERO);
  }

  return value;
}
