import {
  Drawdown as DrawdownEvent,
  PaymentMade as PaymentMadeEvent,
  Liquidation as LiquidationEvent
} from "../../generated/templates/Loan/Loan";

export function handleDrawdown(event: DrawdownEvent): void {}

export function handlePaymentMade(event: PaymentMadeEvent): void {}

export function handleLiquidation(event: LiquidationEvent): void {}
