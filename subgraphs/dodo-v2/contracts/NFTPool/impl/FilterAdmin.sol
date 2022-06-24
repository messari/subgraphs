/*

    Copyright 2021 DODO ZOO.
    SPDX-License-Identifier: Apache-2.0

*/

pragma solidity 0.6.9;
pragma experimental ABIEncoderV2;

import {InitializableInternalMintableERC20} from "../../external/ERC20/InitializableInternalMintableERC20.sol";
import {SafeMath} from "../../lib/SafeMath.sol";
import {IController} from "../intf/IController.sol";
import {DecimalMath} from "../../lib/DecimalMath.sol";

contract FilterAdmin is InitializableInternalMintableERC20 {
    using SafeMath for uint256;

    // ============ Storage ============
    address[] public _FILTERS_;
    mapping(address => bool) public _FILTER_REGISTRY_;
    uint256 public _FEE_RATE_;
    address public _CONTROLLER_;
    address public _MAINTAINER_;
    uint256 public _INIT_SUPPLY_;

    // ============ Event ============
    event ChangeFeeRate(uint256 fee);
    event AddFilter(address filter);

    function init(
        address owner,
        uint256 initSupply,
        string memory name,
        string memory symbol,
        uint256 feeRate,
        address controller,
        address maintainer,
        address[] memory filters
    ) external {
        require(feeRate <= DecimalMath.ONE, "FEE_RATE_TOO_LARGE");
        super.init(owner, initSupply, name, symbol, 18);
        _INIT_SUPPLY_ = initSupply;
        _FEE_RATE_ = feeRate;
        _CONTROLLER_ = controller;
        _MAINTAINER_ = maintainer;
        _FILTERS_ = filters;
        for (uint256 i = 0; i < filters.length; i++) {
            _FILTER_REGISTRY_[filters[i]] = true;
        }
    }

    function mintFragTo(address to, uint256 rawAmount) external returns (uint256) {
        require(isRegisteredFilter(msg.sender), "FILTER_NOT_REGISTERED");

        (uint256 poolFee, uint256 mtFee, uint256 received) = queryMintFee(rawAmount);
        if (poolFee > 0) _mint(_OWNER_, poolFee);
        if (mtFee > 0) _mint(_MAINTAINER_, mtFee);

        _mint(to, received);
        return received;
    }

    function burnFragFrom(address from, uint256 rawAmount) external returns (uint256) {
        require(isRegisteredFilter(msg.sender), "FILTER_NOT_REGISTERED");

        (uint256 poolFee, uint256 mtFee, uint256 paid) = queryBurnFee(rawAmount);
        if (poolFee > 0) _mint(_OWNER_, poolFee);
        if (mtFee > 0) _mint(_MAINTAINER_, mtFee);

        _burn(from, paid);
        return paid;
    }

    //================ View ================
    function queryMintFee(uint256 rawAmount)
        view
        public
        returns (
            uint256 poolFee,
            uint256 mtFee,
            uint256 afterChargedAmount
        )
    {
        uint256 mtFeeRate = IController(_CONTROLLER_).getMintFeeRate(address(this));
        poolFee = DecimalMath.mulFloor(rawAmount, _FEE_RATE_);
        mtFee = DecimalMath.mulFloor(rawAmount, mtFeeRate);
        afterChargedAmount = rawAmount.sub(poolFee).sub(mtFee);
    }

    function queryBurnFee(uint256 rawAmount)
        view
        public
        returns (
            uint256 poolFee,
            uint256 mtFee,
            uint256 afterChargedAmount
        )
    {
        uint256 mtFeeRate = IController(_CONTROLLER_).getBurnFeeRate(address(this));
        poolFee = DecimalMath.mulFloor(rawAmount, _FEE_RATE_);
        mtFee = DecimalMath.mulFloor(rawAmount, mtFeeRate);
        afterChargedAmount = rawAmount.add(poolFee).add(mtFee);
    }

    function isRegisteredFilter(address filter) public view returns (bool) {
        return _FILTER_REGISTRY_[filter];
    }

    function getFilters() public view returns (address[] memory) {
        return _FILTERS_;
    }

    //================= Owner ================
    function addFilter(address[] memory filters) external onlyOwner {
        for(uint256 i = 0; i < filters.length; i++) {
            require(!isRegisteredFilter(filters[i]), "FILTER_ALREADY_EXIST");
            _FILTERS_.push(filters[i]);
            _FILTER_REGISTRY_[filters[i]] = true;
            emit AddFilter(filters[i]);
        }
    }

    function changeFeeRate(uint256 newFeeRate) external onlyOwner {
        require(newFeeRate <= DecimalMath.ONE, "FEE_RATE_TOO_LARGE");
        _FEE_RATE_ = newFeeRate;
        emit ChangeFeeRate(newFeeRate);
    }

    function directTransferOwnership(address newOwner) external onlyOwner {
        emit OwnershipTransferred(_OWNER_, newOwner);
        _OWNER_ = newOwner;
    }

    //================= Support ================
    function version() external pure virtual returns (string memory) {
        return "FILTER ADMIN 1.0.0";
    }
}
