import * as utils from "../common/utils";
import * as constants from "../common/constants";
import { Address, dataSource } from "@graphprotocol/graph-ts";
import { SetGaugeCall } from "../../generated/crvDepositor/Depositors";
import { LockersGauge as LockersGaugeTemplate } from "../../generated/templates";
import { Depositors as DepositorsContract } from "../../generated/crvDepositor/Depositors";

export function handleSetGauge(call: SetGaugeCall): void {
  const depositorAddress = call.to;
  const gaugeAddress = call.inputs._gauge;

  const depositorsContract = DepositorsContract.bind(depositorAddress);
  const inputTokenAddress = utils.readValue<Address>(
    depositorsContract.try_token(),
    constants.NULL.TYPE_ADDRESS
  );

  const context = dataSource.context();
  context.setString("inputToken", inputTokenAddress.toHexString());

  LockersGaugeTemplate.createWithContext(gaugeAddress, context);
}
