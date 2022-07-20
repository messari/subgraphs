import { UpdatePoolWeight } from "../../../../../generated/PoolManager/PoolManager";
import { MasterChef } from "../../../../../src/common/constants";
import { getOrCreateMasterChefStakingPool } from "../../common/helpers";

// This handler is used to update pool allocation weights as well as indicate the creation of a new staking pool.
export function handleUpdatePoolWeight(event: UpdatePoolWeight): void {
  getOrCreateMasterChefStakingPool(
    event,
    MasterChef.MASTERCHEF,
    event.params.index,
    event.params.stakingToken
  );
}
