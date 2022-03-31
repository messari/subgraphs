/*

    Copyright 2020 DODO ZOO.
    SPDX-License-Identifier: Apache-2.0

*/

pragma solidity 0.6.9;

import {Ownable} from "../../lib/Ownable.sol";
import {SafeERC20} from "../../lib/SafeERC20.sol";
import {SafeMath} from "../../lib/SafeMath.sol";
import {IERC20} from "../../intf/IERC20.sol";


interface IRewardVault {
    function reward(address to, uint256 amount) external;
    function withdrawLeftOver(address to, uint256 amount) external; 
    function syncValue() external;
    function _TOTAL_REWARD_() external view returns(uint256);
}

contract RewardVault is Ownable {
    using SafeERC20 for IERC20;
    using SafeMath for uint256;

    uint256 public _REWARD_RESERVE_;
    uint256 public _TOTAL_REWARD_;
    address public _REWARD_TOKEN_;

    // ============ Event =============
    event DepositReward(uint256 totalReward, uint256 inputReward, uint256 rewardReserve);

    constructor(address _rewardToken) public {
        _REWARD_TOKEN_ = _rewardToken;
    }

    function reward(address to, uint256 amount) external onlyOwner {
        require(_REWARD_RESERVE_ >= amount, "VAULT_NOT_ENOUGH");
        _REWARD_RESERVE_ = _REWARD_RESERVE_.sub(amount);
        IERC20(_REWARD_TOKEN_).safeTransfer(to, amount);
    }

    function withdrawLeftOver(address to,uint256 amount) external onlyOwner {
        require(_REWARD_RESERVE_ >= amount, "VAULT_NOT_ENOUGH");
        _REWARD_RESERVE_ = _REWARD_RESERVE_.sub(amount);
        IERC20(_REWARD_TOKEN_).safeTransfer(to, amount);
    }

    function syncValue() external {
        uint256 rewardBalance = IERC20(_REWARD_TOKEN_).balanceOf(address(this));
        uint256 rewardInput = rewardBalance.sub(_REWARD_RESERVE_);

        _TOTAL_REWARD_ = _TOTAL_REWARD_.add(rewardInput);
        _REWARD_RESERVE_ = rewardBalance;

        emit DepositReward(_TOTAL_REWARD_, rewardInput, _REWARD_RESERVE_);
    }
}