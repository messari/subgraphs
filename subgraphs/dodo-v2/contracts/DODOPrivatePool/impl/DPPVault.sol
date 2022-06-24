/*

    Copyright 2020 DODO ZOO.
    SPDX-License-Identifier: Apache-2.0

*/

pragma solidity 0.6.9;
pragma experimental ABIEncoderV2;

import {DPPStorage} from "./DPPStorage.sol";
import {IERC20} from "../../intf/IERC20.sol";
import {IDODOCallee} from "../../intf/IDODOCallee.sol";
import {SafeMath} from "../../lib/SafeMath.sol";
import {DecimalMath} from "../../lib/DecimalMath.sol";
import {SafeERC20} from "../../lib/SafeERC20.sol";
import {PMMPricing} from "../../lib/PMMPricing.sol";

contract DPPVault is DPPStorage {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    // ============ Events ============

    event LpFeeRateChange(uint256 newLpFeeRate);

    // ============ View Functions ============

    function getVaultReserve() external view returns (uint256 baseReserve, uint256 quoteReserve) {
        baseReserve = _BASE_RESERVE_;
        quoteReserve = _QUOTE_RESERVE_;
    }

    function getUserFeeRate(address user)
        external
        view
        returns (uint256 lpFeeRate, uint256 mtFeeRate)
    {
        lpFeeRate = _LP_FEE_RATE_;
        mtFeeRate = _MT_FEE_RATE_MODEL_.getFeeRate(user);
    }

    // ============ Get Input ============

    function getBaseInput() public view returns (uint256 input) {
        return _BASE_TOKEN_.balanceOf(address(this)).sub(uint256(_BASE_RESERVE_));
    }

    function getQuoteInput() public view returns (uint256 input) {
        return _QUOTE_TOKEN_.balanceOf(address(this)).sub(uint256(_QUOTE_RESERVE_));
    }

    // ============ TWAP UPDATE ===========
    
    function _twapUpdate() internal {
        uint32 blockTimestamp = uint32(block.timestamp % 2**32);
        uint32 timeElapsed = blockTimestamp - _BLOCK_TIMESTAMP_LAST_;
        if (timeElapsed > 0 && _BASE_RESERVE_ != 0 && _QUOTE_RESERVE_ != 0) {
            _BASE_PRICE_CUMULATIVE_LAST_ += getMidPrice() * timeElapsed;
        }
        _BLOCK_TIMESTAMP_LAST_ = blockTimestamp;
    }

    // ============ Set Status ============

    function _setReserve(uint256 baseReserve, uint256 quoteReserve) internal {
        require(baseReserve <= uint112(-1) && quoteReserve <= uint112(-1), "OVERFLOW");
        _BASE_RESERVE_ = uint112(baseReserve);
        _QUOTE_RESERVE_ = uint112(quoteReserve);

        if(_IS_OPEN_TWAP_) _twapUpdate();
    }

    function _sync() internal {
        uint256 baseBalance = _BASE_TOKEN_.balanceOf(address(this));
        uint256 quoteBalance = _QUOTE_TOKEN_.balanceOf(address(this));
        
        require(baseBalance <= uint112(-1) && quoteBalance <= uint112(-1), "OVERFLOW");

        if (baseBalance != _BASE_RESERVE_) {
            _BASE_RESERVE_ = uint112(baseBalance);
        }
        if (quoteBalance != _QUOTE_RESERVE_) {
            _QUOTE_RESERVE_ = uint112(quoteBalance);
        }

        if(_IS_OPEN_TWAP_) _twapUpdate();
    }

    function _resetTargetAndReserve() internal {
        uint256 baseBalance = _BASE_TOKEN_.balanceOf(address(this));
        uint256 quoteBalance = _QUOTE_TOKEN_.balanceOf(address(this));

        require(baseBalance <= uint112(-1) && quoteBalance <= uint112(-1), "OVERFLOW");
        
        _BASE_RESERVE_ = uint112(baseBalance);
        _QUOTE_RESERVE_ = uint112(quoteBalance);
        _BASE_TARGET_ = uint112(baseBalance);
        _QUOTE_TARGET_ = uint112(quoteBalance);
        _RState_ = uint32(PMMPricing.RState.ONE);

        if(_IS_OPEN_TWAP_) _twapUpdate();
    }

    function ratioSync() external preventReentrant onlyOwner {
        uint256 baseBalance = _BASE_TOKEN_.balanceOf(address(this));
        uint256 quoteBalance = _QUOTE_TOKEN_.balanceOf(address(this));

        require(baseBalance <= uint112(-1) && quoteBalance <= uint112(-1), "OVERFLOW");

        if (baseBalance != _BASE_RESERVE_) {
            _BASE_TARGET_ = uint112(uint256(_BASE_TARGET_).mul(baseBalance).div(uint256(_BASE_RESERVE_)));
            _BASE_RESERVE_ = uint112(baseBalance);
        }
        if (quoteBalance != _QUOTE_RESERVE_) {
            _QUOTE_TARGET_ = uint112(uint256(_QUOTE_TARGET_).mul(quoteBalance).div(uint256(_QUOTE_RESERVE_)));
            _QUOTE_RESERVE_ = uint112(quoteBalance);
        }

        if(_IS_OPEN_TWAP_) _twapUpdate();
    }

    function reset(
        address assetTo,
        uint256 newLpFeeRate,
        uint256 newI,
        uint256 newK,
        uint256 baseOutAmount,
        uint256 quoteOutAmount,
        uint256 minBaseReserve,
        uint256 minQuoteReserve
    ) public preventReentrant onlyOwner returns (bool) {
        require(
            _BASE_RESERVE_ >= minBaseReserve && _QUOTE_RESERVE_ >= minQuoteReserve,
            "RESERVE_AMOUNT_IS_NOT_ENOUGH"
        );
        require(newLpFeeRate <= 1e18, "LP_FEE_RATE_OUT_OF_RANGE");
        require(newK <= 1e18, "K_OUT_OF_RANGE");
        require(newI > 0 && newI <= 1e36, "I_OUT_OF_RANGE");
        _LP_FEE_RATE_ = uint64(newLpFeeRate);
        _K_ = uint64(newK);
        _I_ = uint128(newI);
        _transferBaseOut(assetTo, baseOutAmount);
        _transferQuoteOut(assetTo, quoteOutAmount);
        _resetTargetAndReserve();
        emit LpFeeRateChange(newLpFeeRate);
        return true;
    }

    // ============ Asset Out ============

    function _transferBaseOut(address to, uint256 amount) internal {
        if (amount > 0) {
            _BASE_TOKEN_.safeTransfer(to, amount);
        }
    }

    function _transferQuoteOut(address to, uint256 amount) internal {
        if (amount > 0) {
            _QUOTE_TOKEN_.safeTransfer(to, amount);
        }
    }

    function retrieve(
        address to,
        address token,
        uint256 amount
    ) external preventReentrant onlyOwner {
        require(token != address(_BASE_TOKEN_) && token != address(_QUOTE_TOKEN_), "USE_RESET");
        IERC20(token).safeTransfer(to, amount);
    }
}
