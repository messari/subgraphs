pragma solidity 0.6.9;
pragma experimental ABIEncoderV2;

interface IChi {
    function freeUpTo(uint256 value) external returns (uint256);
}