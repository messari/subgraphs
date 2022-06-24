/*

    Copyright 2020 DODO ZOO.
    SPDX-License-Identifier: Apache-2.0

*/

pragma solidity 0.6.9;
pragma experimental ABIEncoderV2;

import {InitializableOwnable} from "../../lib/InitializableOwnable.sol";
import {ReentrancyGuard} from "../../lib/ReentrancyGuard.sol";
import {IPermissionManager} from "../../lib/PermissionManager.sol";
import {IFeeRateModel} from "../../lib/FeeRateModel.sol";
import {SafeMath} from "../../lib/SafeMath.sol";
import {IERC20} from "../../intf/IERC20.sol";

contract CPStorage is InitializableOwnable, ReentrancyGuard {
    using SafeMath for uint256;

    // ============ Constant ============
    
    uint256 internal constant _SETTLEMENT_EXPIRE_ = 86400 * 7;
    uint256 internal constant _SETTEL_FUND_ = 200 finney;
    bool public _IS_OPEN_TWAP_ = false;

    // ============ Timeline ============

    uint256 public _PHASE_BID_STARTTIME_;
    uint256 public _PHASE_BID_ENDTIME_;
    uint256 public _PHASE_CALM_ENDTIME_;
    uint256 public _SETTLED_TIME_;
    bool public _SETTLED_;

    // ============ Core Address ============

    IERC20 public _BASE_TOKEN_;
    IERC20 public _QUOTE_TOKEN_;

    // ============ Distribution Parameters ============

    uint256 public _TOTAL_BASE_;
    uint256 public _POOL_QUOTE_CAP_;

    // ============ Settlement ============

    uint256 public _QUOTE_RESERVE_;

    uint256 public _UNUSED_BASE_;
    uint256 public _UNUSED_QUOTE_;

    uint256 public _TOTAL_SHARES_;
    mapping(address => uint256) internal _SHARES_;
    mapping(address => bool) public _CLAIMED_;

    address public _POOL_FACTORY_;
    address public _POOL_;
    uint256 public _AVG_SETTLED_PRICE_;

    // ============ Advanced Control ============

    address public _MAINTAINER_;
    IFeeRateModel public _MT_FEE_RATE_MODEL_;
    IPermissionManager public _BIDDER_PERMISSION_;

    // ============ PMM Parameters ============

    uint256 public _K_;
    uint256 public _I_;

    // ============ LP Token Vesting ============

    uint256 public _TOTAL_LP_AMOUNT_;
    uint256 public _FREEZE_DURATION_;
    uint256 public _VESTING_DURATION_;
    uint256 public _CLIFF_RATE_;

    // ============ Modifiers ============

    modifier phaseBid() {
        require(
            block.timestamp >= _PHASE_BID_STARTTIME_ && block.timestamp < _PHASE_BID_ENDTIME_,
            "NOT_PHASE_BID"
        );
        _;
    }

    modifier phaseCalm() {
        require(
            block.timestamp >= _PHASE_BID_ENDTIME_ && block.timestamp < _PHASE_CALM_ENDTIME_,
            "NOT_PHASE_CALM"
        );
        _;
    }

    modifier phaseBidOrCalm() {
        require(
            block.timestamp >= _PHASE_BID_STARTTIME_ && block.timestamp < _PHASE_CALM_ENDTIME_,
            "NOT_PHASE_BID_OR_CALM"
        );
        _;
    }

    modifier phaseSettlement() {
        require(block.timestamp >= _PHASE_CALM_ENDTIME_, "NOT_PHASE_EXE");
        _;
    }

    modifier phaseVesting() {
        require(_SETTLED_, "NOT_VESTING");
        _;
    }
}
