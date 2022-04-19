import { Address, BigDecimal, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { Controller } from "../../generated/bveCVX/Controller";
import { Strategy as StrategyContract } from "../../generated/bveCVX/Strategy";
import { VaultV4 as VaultContract } from "../../generated/bveCVX/VaultV4";
import { Vault, VaultFee, _Strategy } from "../../generated/schema";
import { BIGDECIMAL_ZERO, BIGINT_ZERO, NULL_ADDRESS, VaultFeeType } from "../constant";
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
  vault.inputTokens = [];
  vault.outputToken = "";
  vault.rewardTokens = [];
  vault.totalValueLockedUSD = BIGDECIMAL_ZERO;
  vault.totalVolumeUSD = BIGDECIMAL_ZERO;
  vault.inputTokenBalances = [];
  vault.outputTokenSupply = BIGINT_ZERO;
  vault.outputTokenPriceUSD = BIGDECIMAL_ZERO;
  vault.pricePerShare = BIGINT_ZERO;
  vault.rewardTokenEmissionsAmount = [];
  vault.rewardTokenEmissionsUSD = [];
  vault.createdTimestamp = block.timestamp;
  vault.createdBlockNumber = block.number;
  vault.name = "";
  vault.symbol = "";
  vault.depositLimit = BIGINT_ZERO;
  vault.fees = [];
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
  vault.inputTokens = [inputToken.id];
  vault.inputTokenBalances = [BIGINT_ZERO];

  let outputToken = getOrCreateToken(vaultAddress);
  vault.outputToken = outputToken.id;
  vault.outputTokenSupply = BIGINT_ZERO;
  vault.save();

  let controllerAddress = readValue<Address>(vaultContract.try_controller(), NULL_ADDRESS);
  let controllerContract = Controller.bind(controllerAddress);
  let strategyAddress = readValue<Address>(controllerContract.try_strategies(inputTokenAddress), NULL_ADDRESS);

  if (strategyAddress.notEqual(NULL_ADDRESS)) {
    let strategy = new _Strategy(strategyAddress.toHex());
    strategy.vault = vault.id;
    strategy.token = inputToken.id;
    strategy.save();

    let strategyContract = StrategyContract.bind(strategyAddress);

    let performanceFeeId = enumToPrefix(VaultFeeType.PERFORMANCE_FEE).concat(vaultAddress.toHex());
    let performanceFee = readValue<BigInt>(strategyContract.try_performanceFeeGovernance(), BIGINT_ZERO);
    createFeeType(performanceFeeId, performanceFee.toBigDecimal(), VaultFeeType.PERFORMANCE_FEE);

    let withdrawFeeId = enumToPrefix(VaultFeeType.WITHDRAWAL_FEE).concat(vaultAddress.toHex());
    let withdrawFee = readValue<BigInt>(strategyContract.try_withdrawalFee(), BIGINT_ZERO);
    createFeeType(withdrawFeeId, withdrawFee.toBigDecimal(), VaultFeeType.WITHDRAWAL_FEE);

    vault.fees = [withdrawFeeId, performanceFeeId];
    vault.save();
  }

  return vault;
}

export function getFeePercentage(vault: Vault, feeType: string): BigDecimal {
  for (let i = 0; i < vault.fees.length; i++) {
    let feeId = vault.fees[i];
    let fee = VaultFee.load(feeId);

    if (fee && fee.feeType == feeType) {
      return fee.feePercentage;
    }
  }

  return BIGDECIMAL_ZERO;
}

function createFeeType(id: string, feePercentage: BigDecimal, feeType: string): void {
  let fee = new VaultFee(id);

  fee.feePercentage = feePercentage;
  fee.feeType = feeType;
  fee.save();
}
