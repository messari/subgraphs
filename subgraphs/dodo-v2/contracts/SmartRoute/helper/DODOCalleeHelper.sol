/*

    Copyright 2020 DODO ZOO.
    SPDX-License-Identifier: Apache-2.0

*/

pragma solidity 0.6.9;
pragma experimental ABIEncoderV2;

import {IDODOV2} from "../intf/IDODOV2.sol";
import {IFragment} from "../../GeneralizedFragment/intf/IFragment.sol";
import {IERC20} from "../../intf/IERC20.sol";
import {IWETH} from "../../intf/IWETH.sol";
import {SafeERC20} from "../../lib/SafeERC20.sol";
import {ReentrancyGuard} from "../../lib/ReentrancyGuard.sol";

contract DODOCalleeHelper is ReentrancyGuard {
    using SafeERC20 for IERC20;
    address payable public immutable _WETH_;

    fallback() external payable {
        require(msg.sender == _WETH_, "WE_SAVED_YOUR_ETH");
    }

    receive() external payable {
        require(msg.sender == _WETH_, "WE_SAVED_YOUR_ETH");
    }

    constructor(address payable weth) public {
        _WETH_ = weth;
    }

    function DVMSellShareCall(
        address payable assetTo,
        uint256,
        uint256 baseAmount,
        uint256 quoteAmount,
        bytes calldata
    ) external preventReentrant {
        address _baseToken = IDODOV2(msg.sender)._BASE_TOKEN_();
        address _quoteToken = IDODOV2(msg.sender)._QUOTE_TOKEN_();
        _withdraw(assetTo, _baseToken, baseAmount, _baseToken == _WETH_);
        _withdraw(assetTo, _quoteToken, quoteAmount, _quoteToken == _WETH_);
    }

    function CPCancelCall(
        address payable assetTo,
        uint256 amount,
        bytes calldata
    )external preventReentrant{
        address _quoteToken = IDODOV2(msg.sender)._QUOTE_TOKEN_();
        _withdraw(assetTo, _quoteToken, amount, _quoteToken == _WETH_);
    }

	function CPClaimBidCall(
        address payable assetTo,
        uint256 baseAmount,
        uint256 quoteAmount,
        bytes calldata
    ) external preventReentrant {
        address _baseToken = IDODOV2(msg.sender)._BASE_TOKEN_();
        address _quoteToken = IDODOV2(msg.sender)._QUOTE_TOKEN_();
        _withdraw(assetTo, _baseToken, baseAmount, _baseToken == _WETH_);
        _withdraw(assetTo, _quoteToken, quoteAmount, _quoteToken == _WETH_);
    }

    function NFTRedeemCall(
        address payable assetTo,
        uint256 quoteAmount,
        bytes calldata
    ) external preventReentrant {
        address _quoteToken = IFragment(msg.sender)._QUOTE_();
        _withdraw(assetTo, _quoteToken, quoteAmount, _quoteToken == _WETH_);
    }

    function _withdraw(
        address payable to,
        address token,
        uint256 amount,
        bool isETH
    ) internal {
        if (isETH) {
            if (amount > 0) {
                IWETH(_WETH_).withdraw(amount);
                to.transfer(amount);
            }
        } else {
            if (amount > 0) {
                SafeERC20.safeTransfer(IERC20(token), to, amount);
            }
        }
    }
}
