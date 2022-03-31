/*

    Copyright 2020 DODO ZOO.
    SPDX-License-Identifier: Apache-2.0

*/

pragma solidity 0.6.9;

import {InitializableOwnable} from "../lib/InitializableOwnable.sol";
import {SafeERC20} from "../lib/SafeERC20.sol";
import {SafeMath} from "../lib/SafeMath.sol";
import {IERC20} from "../intf/IERC20.sol";

interface IDODOIncentive {
    function triggerIncentive(
        address fromToken,
        address toToken,
        address assetTo
    ) external;
}

/**
 * @title DODOIncentive
 * @author DODO Breeder
 *
 * @notice Trade Incentive in DODO platform
 */
contract DODOIncentive is InitializableOwnable {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    // ============ Storage ============
    address public immutable _DODO_TOKEN_;
    address public _DODO_PROXY_;
    uint256 public dodoPerBlock;
    uint256 public defaultRate = 10;
    mapping(address => uint256) public boosts;

    uint32 public lastRewardBlock;
    uint112 public totalReward;
    uint112 public totalDistribution;

    // ============ Events ============

    event SetBoost(address token, uint256 boostRate);
    event SetNewProxy(address dodoProxy);
    event SetPerReward(uint256 dodoPerBlock);
    event SetDefaultRate(uint256 defaultRate);
    event Incentive(address user, uint256 reward);

    constructor(address _dodoToken) public {
        _DODO_TOKEN_ = _dodoToken;
    }

    // ============ Ownable ============

    function changeBoost(address _token, uint256 _boostRate) public onlyOwner {
        require(_token != address(0));
        require(_boostRate + defaultRate <= 1000);
        boosts[_token] = _boostRate;
        emit SetBoost(_token, _boostRate);
    }

    function changePerReward(uint256 _dodoPerBlock) public onlyOwner {
        _updateTotalReward();
        dodoPerBlock = _dodoPerBlock;
        emit SetPerReward(dodoPerBlock);
    }

    function changeDefaultRate(uint256 _defaultRate) public onlyOwner {
        defaultRate = _defaultRate;
        emit SetDefaultRate(defaultRate);
    }

    function changeDODOProxy(address _dodoProxy) public onlyOwner {
        _DODO_PROXY_ = _dodoProxy;
        emit SetNewProxy(_DODO_PROXY_);
    }

    function emptyReward(address assetTo) public onlyOwner {
        uint256 balance = IERC20(_DODO_TOKEN_).balanceOf(address(this));
        IERC20(_DODO_TOKEN_).transfer(assetTo, balance);
    }

    // ============ Incentive  function ============

    function triggerIncentive(
        address fromToken,
        address toToken,
        address assetTo
    ) external {
        require(msg.sender == _DODO_PROXY_, "DODOIncentive:Access restricted");

        uint256 curTotalDistribution = totalDistribution;
        uint256 fromRate = boosts[fromToken];
        uint256 toRate = boosts[toToken];
        uint256 rate = (fromRate >= toRate ? fromRate : toRate) + defaultRate;
        require(rate <= 1000, "RATE_INVALID");
        
        uint256 _totalReward = _getTotalReward();
        uint256 reward = ((_totalReward - curTotalDistribution) * rate) / 1000;
        uint256 _totalDistribution = curTotalDistribution + reward;

        _update(_totalReward, _totalDistribution);
        if (reward != 0) {
            IERC20(_DODO_TOKEN_).transfer(assetTo, reward);
            emit Incentive(assetTo, reward);
        }
    }

    function _updateTotalReward() internal {
        uint256 _totalReward = _getTotalReward();
        require(_totalReward < uint112(-1), "OVERFLOW");
        totalReward = uint112(_totalReward);
        lastRewardBlock = uint32(block.number);
    }

    function _update(uint256 _totalReward, uint256 _totalDistribution) internal {
        require(
            _totalReward < uint112(-1) && _totalDistribution < uint112(-1) && block.number < uint32(-1),
            "OVERFLOW"
        );
        lastRewardBlock = uint32(block.number);
        totalReward = uint112(_totalReward);
        totalDistribution = uint112(_totalDistribution);
    }

    function _getTotalReward() internal view returns (uint256) {
        if (lastRewardBlock == 0) {
            return totalReward;
        } else {
            return totalReward + (block.number - lastRewardBlock) * dodoPerBlock;
        }
    }

    // ============= Helper function ===============

    function incentiveStatus(address fromToken, address toToken)
        external
        view
        returns (
            uint256 reward,
            uint256 baseRate,
            uint256 totalRate,
            uint256 curTotalReward,
            uint256 perBlockReward
        )
    {
        baseRate = defaultRate;
        uint256 fromRate = boosts[fromToken];
        uint256 toRate = boosts[toToken];
        totalRate = (fromRate >= toRate ? fromRate : toRate) + defaultRate;
        uint256 _totalReward = _getTotalReward();
        reward = ((_totalReward - totalDistribution) * totalRate) / 1000;
        curTotalReward = _totalReward - totalDistribution;
        perBlockReward = dodoPerBlock;
    }
}
