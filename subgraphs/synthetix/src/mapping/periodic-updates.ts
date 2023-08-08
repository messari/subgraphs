// The latest Synthetix and event invocations

import { Synthetix as SNX } from "../../generated/periodicUpdates_ProxyERC20_0/Synthetix";
import { SynthetixDebtShare } from "../../generated/periodicUpdates_ProxyERC20_0/SynthetixDebtShare";
import { SystemSettings as SystemSettingsContract } from "../../generated/periodicUpdates_ProxyERC20_0/SystemSettings";

import { CANDLE_PERIODS, strToBytes, toDecimal, ZERO } from "./lib/helpers";

// SynthetixState has not changed ABI since deployment

import { DebtState, SystemSetting } from "../../generated/schema";

import { BigInt, ethereum, dataSource, log } from "@graphprotocol/graph-ts";
import { getContractDeployment } from "../../protocols/addresses";

export function handleBlock(block: ethereum.Block): void {
  if (block.number.mod(BigInt.fromI32(6000)).equals(BigInt.fromI32(0))) {
    trackSystemSettings(block);
  }
  if (block.number.mod(BigInt.fromI32(25)).equals(BigInt.fromI32(0))) {
    trackGlobalDebt(block);
  }
}

export function trackSystemSettings(block: ethereum.Block): void {
  const timeSlot = block.timestamp.minus(
    block.timestamp.mod(BigInt.fromI32(900))
  );

  const curSystemSettings = SystemSetting.load(timeSlot.toString());

  if (curSystemSettings == null) {
    const systemSettingsAddress = getContractDeployment(
      "SystemSettings",
      dataSource.network()
    )!;
    const systemSettings = SystemSettingsContract.bind(systemSettingsAddress);
    const systemSettingsEntity = new SystemSetting(timeSlot.toString());
    systemSettingsEntity.timestamp = block.timestamp;

    const waitingPeriodSecs = systemSettings.try_waitingPeriodSecs();
    if (!waitingPeriodSecs.reverted) {
      systemSettingsEntity.waitingPeriodSecs = waitingPeriodSecs.value;
    }

    const priceDeviationThresholdFactor =
      systemSettings.try_priceDeviationThresholdFactor();
    if (!priceDeviationThresholdFactor.reverted) {
      systemSettingsEntity.priceDeviationThresholdFactor = toDecimal(
        priceDeviationThresholdFactor.value
      );
    }

    const issuanceRatio = systemSettings.try_issuanceRatio();
    if (!issuanceRatio.reverted) {
      systemSettingsEntity.issuanceRatio = toDecimal(issuanceRatio.value);
    }

    const feePeriodDuration = systemSettings.try_feePeriodDuration();
    if (!feePeriodDuration.reverted) {
      systemSettingsEntity.feePeriodDuration = feePeriodDuration.value;
    }

    const targetThreshold = systemSettings.try_targetThreshold();
    if (!targetThreshold.reverted) {
      systemSettingsEntity.targetThreshold = toDecimal(targetThreshold.value);
    }

    const liquidationDelay = systemSettings.try_liquidationDelay();
    if (!liquidationDelay.reverted) {
      systemSettingsEntity.liquidationDelay = liquidationDelay.value;
    }

    const liquidationRatio = systemSettings.try_liquidationRatio();
    if (!liquidationRatio.reverted) {
      systemSettingsEntity.liquidationRatio = toDecimal(liquidationRatio.value);
    }

    const liquidationPenalty = systemSettings.try_liquidationPenalty();
    if (!liquidationPenalty.reverted) {
      systemSettingsEntity.liquidationPenalty = toDecimal(
        liquidationPenalty.value
      );
    }

    const rateStalePeriod = systemSettings.try_rateStalePeriod();
    if (!rateStalePeriod.reverted) {
      systemSettingsEntity.rateStalePeriod = rateStalePeriod.value;
    }

    const debtSnapshotStaleTime = systemSettings.try_debtSnapshotStaleTime();
    if (!debtSnapshotStaleTime.reverted) {
      systemSettingsEntity.debtSnapshotStaleTime = debtSnapshotStaleTime.value;
    }

    const aggregatorWarningFlags = systemSettings.try_aggregatorWarningFlags();
    if (!aggregatorWarningFlags.reverted) {
      systemSettingsEntity.aggregatorWarningFlags =
        aggregatorWarningFlags.value.toHexString();
    }

    const etherWrapperMaxETH = systemSettings.try_etherWrapperMaxETH();
    if (!etherWrapperMaxETH.reverted) {
      systemSettingsEntity.etherWrapperMaxETH = toDecimal(
        etherWrapperMaxETH.value
      );
    }

    const etherWrapperMintFeeRate =
      systemSettings.try_etherWrapperMintFeeRate();
    if (!etherWrapperMintFeeRate.reverted) {
      systemSettingsEntity.etherWrapperMintFeeRate = toDecimal(
        etherWrapperMintFeeRate.value
      );
    }

    const etherWrapperBurnFeeRate =
      systemSettings.try_etherWrapperBurnFeeRate();
    if (!etherWrapperBurnFeeRate.reverted) {
      systemSettingsEntity.etherWrapperBurnFeeRate = toDecimal(
        etherWrapperBurnFeeRate.value
      );
    }

    const atomicMaxVolumePerBlock =
      systemSettings.try_atomicMaxVolumePerBlock();
    if (!atomicMaxVolumePerBlock.reverted) {
      systemSettingsEntity.atomicMaxVolumePerBlock =
        atomicMaxVolumePerBlock.value;
    }

    const atomicTwapWindow = systemSettings.try_atomicTwapWindow();
    if (!atomicTwapWindow.reverted) {
      systemSettingsEntity.atomicTwapWindow = atomicTwapWindow.value;
    }

    systemSettingsEntity.save();
  }
}

export function trackGlobalDebt(block: ethereum.Block): void {
  const timeSlot = block.timestamp.minus(
    block.timestamp.mod(BigInt.fromI32(900))
  );

  const curDebtState = DebtState.load(timeSlot.toString());

  if (curDebtState == null) {
    const sdsAddress = getContractDeployment(
      "SynthetixDebtShare",
      dataSource.network()
    )!;
    const sds = SynthetixDebtShare.bind(sdsAddress);

    const synthetix = SNX.bind(dataSource.address());
    let issuedSynths = synthetix.try_totalIssuedSynthsExcludeOtherCollateral(
      strToBytes("sUSD", 32)
    );

    if (issuedSynths.reverted) {
      issuedSynths = synthetix.try_totalIssuedSynthsExcludeEtherCollateral(
        strToBytes("sUSD", 32)
      );

      if (issuedSynths.reverted) {
        issuedSynths = synthetix.try_totalIssuedSynths(strToBytes("sUSD", 32));
        if (issuedSynths.reverted) {
          // for some reason this can happen (not sure how)
          log.debug("failed to get issued synths (skip", []);
          return;
        }
      }
    }

    const debtSharesSupply = sds.try_totalSupply();
    if (!debtSharesSupply.reverted) {
      for (let p = 0; p < CANDLE_PERIODS.length; p++) {
        const period = CANDLE_PERIODS[p];
        const periodId = block.timestamp.minus(block.timestamp.mod(period));
        const id = period.toString() + "-" + periodId.toString();

        const debtStateEntity = new DebtState(id);

        debtStateEntity.debtEntry = toDecimal(debtSharesSupply.value);
        debtStateEntity.totalIssuedSynths = toDecimal(issuedSynths.value);

        debtStateEntity.debtRatio = debtStateEntity.debtEntry.equals(
          toDecimal(ZERO)
        )
          ? toDecimal(ZERO)
          : debtStateEntity.totalIssuedSynths.div(debtStateEntity.debtEntry);

        debtStateEntity.timestamp = block.timestamp;
        debtStateEntity.period = period;

        debtStateEntity.save();
      }
    }
  }
}
