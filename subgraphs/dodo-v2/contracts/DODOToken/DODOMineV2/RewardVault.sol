/*

    Copyright 2020 DODO ZOO.
    SPDX-License-Identifier: Apache-2.0

*/

pragma solidity 0.6.9;

import {Ownable} from "../../lib/Ownable.sol";
import {SafeERC20} from "../../lib/SafeERC20.sol";
import {IERC20} from "../../intf/IERC20.sol";


interface IRewardVault {
    function reward(address to, uint256 amount) external;
    function withdrawLeftOver(address to, uint256 amount) external; 
}

contract RewardVault is Ownable {
    using SafeERC20 for IERC20;

    address public rewardToken;

    constructor(address _rewardToken) public {
        rewardToken = _rewardToken;
    }

    function reward(address to, uint256 amount) external onlyOwner {
        IERC20(rewardToken).safeTransfer(to, amount);
    }

    function withdrawLeftOver(address to,uint256 amount) external onlyOwner {
        uint256 leftover = IERC20(rewardToken).balanceOf(address(this));
        require(amount <= leftover, "VAULT_NOT_ENOUGH");
        IERC20(rewardToken).safeTransfer(to, amount);
    }
}
