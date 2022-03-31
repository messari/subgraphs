/*
    Copyright 2021 DODO ZOO.
    SPDX-License-Identifier: Apache-2.0
*/

pragma solidity 0.6.9;
pragma experimental ABIEncoderV2;

import {IDODOAdapter} from "../intf/IDODOAdapter.sol";
import {IUniswapV3SwapCallback} from "../intf/IUniswapV3SwapCallback.sol";
import {IUniV3} from "../intf/IUniV3.sol";
import {IERC20} from "../../intf/IERC20.sol";
import {SafeMath} from "../../lib/SafeMath.sol";
import {UniversalERC20} from "../lib/UniversalERC20.sol";
import {SafeERC20} from "../../lib/SafeERC20.sol";
import {TickMath} from '../../external/uniswap/TickMath.sol';
import {IWETH} from "../../intf/IWETH.sol";

// to adapter like dodo V1
contract UniV3Adapter is IDODOAdapter, IUniswapV3SwapCallback {
    using SafeMath for uint;

    // ============ Storage ============

    address constant _ETH_ADDRESS_ = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;
    address public immutable _WETH_;

    constructor (
        address payable weth
    ) public {
        _WETH_ = weth;
    }

    function _uniV3Swap(address to, address pool, uint160 sqrtX96, bytes memory data) internal {
        (address fromToken, address toToken, uint24 fee) = abi.decode(data, (address, address, uint24));
        
        uint256 sellAmount = IERC20(fromToken).balanceOf(address(this));
        bool zeroForOne = fromToken < toToken;

        // transfer
        //IERC20(fromToken).transfer(pool, sellAmount);
        // swap
        IUniV3(pool).swap(
            to, 
            zeroForOne, 
            int256(sellAmount), 
            sqrtX96 == 0
                ? (zeroForOne ? TickMath.MIN_SQRT_RATIO + 1 : TickMath.MAX_SQRT_RATIO - 1)
                : sqrtX96,
            data
        );
    }

    function sellBase(address to, address pool, bytes memory moreInfo) external override {
        (uint160 sqrtX96, bytes memory data) = abi.decode(moreInfo, (uint160, bytes));
        _uniV3Swap(to, pool, sqrtX96, data);
    }

    function sellQuote(address to, address pool, bytes memory moreInfo) external override {
        (uint160 sqrtX96, bytes memory data) = abi.decode(moreInfo, (uint160, bytes));
        _uniV3Swap(to, pool, sqrtX96, data);
    }


    // for uniV3 callback
    function uniswapV3SwapCallback(
        int256 amount0Delta,
        int256 amount1Delta,
        bytes calldata _data
    ) external override {
        require(amount0Delta > 0 || amount1Delta > 0); // swaps entirely within 0-liquidity regions are not supported
        (address tokenIn, address tokenOut, uint24 fee) = abi.decode(_data, (address, address, uint24));

        (bool isExactInput, uint256 amountToPay) =
            amount0Delta > 0
                ? (tokenIn < tokenOut, uint256(amount0Delta))
                : (tokenOut < tokenIn, uint256(amount1Delta));
        if (isExactInput) {
            pay(tokenIn, address(this), msg.sender, amountToPay);
        } else {           
            tokenIn = tokenOut; // swap in/out because exact output swaps are reversed
            pay(tokenIn, address(this), msg.sender, amountToPay);
        }
    }

    /// @param token The token to pay
    /// @param payer The entity that must pay
    /// @param recipient The entity that will receive payment
    /// @param value The amount to pay
    function pay(
        address token,
        address payer,
        address recipient,
        uint256 value
    ) internal {
        if (token == _WETH_ && address(this).balance >= value) {
            // pay with WETH9
            IWETH(_WETH_).deposit{value: value}(); // wrap only what is needed to pay
            IWETH(_WETH_).transfer(recipient, value);
        } else if (payer == address(this)) {
            // pay with tokens already in the contract (for the exact input multihop case)
            SafeERC20.safeTransfer(IERC20(token), recipient, value);
        } else {
            // pull payment
            SafeERC20.safeTransferFrom(IERC20(token), payer, recipient, value);
        }
    }
}
