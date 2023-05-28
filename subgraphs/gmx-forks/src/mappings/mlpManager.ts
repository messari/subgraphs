import {
  AddLiquidity as AddLiquidityEvent,
  RemoveLiquidity as RemoveLiquidityEvent,
} from "../../generated/templates/MlpManagerTemplate/MlpManager";
import { transaction } from "../modules/transaction";
import { TransactionType } from "../sdk/protocols/perpfutures/enums";

export function handleAddLiquidity(event: AddLiquidityEvent): void {
  transaction(
    event,
    event.params.account,
    event.params.token,
    event.params.aumInUsdg,
    event.params.glpSupply,
    event.params.mintAmount,
    TransactionType.DEPOSIT,
    event.params.amount
  );
}

export function handleRemoveLiquidity(event: RemoveLiquidityEvent): void {
  transaction(
    event,
    event.params.account,
    event.params.token,
    event.params.aumInUsdg,
    event.params.glpSupply,
    event.params.glpAmount,
    TransactionType.WITHDRAW,
    event.params.amountOut
  );
}
