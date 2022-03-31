/*

    Copyright 2021 DODO ZOO.
    SPDX-License-Identifier: Apache-2.0

*/

pragma solidity 0.6.9;
pragma experimental ABIEncoderV2;

import {ICloneFactory} from "../lib/CloneFactory.sol";
import {InitializableOwnable} from "../lib/InitializableOwnable.sol";

interface IStdERC20 {
    function init(
        address _creator,
        uint256 _totalSupply,
        string memory _name,
        string memory _symbol,
        uint8 _decimals
    ) external;
}

interface ICustomERC20 {
    function init(
        address _creator,
        uint256 _initSupply,
        string memory _name,
        string memory _symbol,
        uint8 _decimals,
        uint256 _tradeBurnRatio,
        uint256 _tradeFeeRatio,
        address _team,
        bool _isMintable
    ) external;
}

/**
 * @title DODO ERC20V2Factory
 * @author DODO Breeder
 *
 * @notice Help user to create erc20 token
 */
contract ERC20V2Factory is InitializableOwnable {
    // ============ Templates ============

    address public immutable _CLONE_FACTORY_;
    address public _ERC20_TEMPLATE_;
    address public _CUSTOM_ERC20_TEMPLATE_;
    uint256 public _CREATE_FEE_;

    // ============ Events ============
    // 0 Std 1 TradeBurn or TradeFee 2 Mintable
    event NewERC20(address erc20, address creator, uint256 erc20Type);
    event ChangeCreateFee(uint256 newFee);
    event Withdraw(address account, uint256 amount);
    event ChangeStdTemplate(address newStdTemplate);
    event ChangeCustomTemplate(address newCustomTemplate);

    // ============ Registry ============
    // creator -> token address list
    mapping(address => address[]) public _USER_STD_REGISTRY_;
    mapping(address => address[]) public _USER_CUSTOM_REGISTRY_;

    // ============ Functions ============

    fallback() external payable {}

    receive() external payable {}

    constructor(
        address cloneFactory,
        address erc20Template,
        address customErc20Template
    ) public {
        _CLONE_FACTORY_ = cloneFactory;
        _ERC20_TEMPLATE_ = erc20Template;
        _CUSTOM_ERC20_TEMPLATE_ = customErc20Template;
    }

    function createStdERC20(
        uint256 totalSupply,
        string memory name,
        string memory symbol,
        uint8 decimals
    ) external payable returns (address newERC20) {
        require(msg.value >= _CREATE_FEE_, "CREATE_FEE_NOT_ENOUGH");
        newERC20 = ICloneFactory(_CLONE_FACTORY_).clone(_ERC20_TEMPLATE_);
        IStdERC20(newERC20).init(msg.sender, totalSupply, name, symbol, decimals);
        _USER_STD_REGISTRY_[msg.sender].push(newERC20);
        emit NewERC20(newERC20, msg.sender, 0);
    }

    function createCustomERC20(
        uint256 initSupply,
        string memory name,
        string memory symbol,
        uint8 decimals,
        uint256 tradeBurnRatio,
        uint256 tradeFeeRatio,
        address teamAccount,
        bool isMintable
    ) external payable returns (address newCustomERC20) {
        require(msg.value >= _CREATE_FEE_, "CREATE_FEE_NOT_ENOUGH");
        newCustomERC20 = ICloneFactory(_CLONE_FACTORY_).clone(_CUSTOM_ERC20_TEMPLATE_);

        ICustomERC20(newCustomERC20).init(
            msg.sender,
            initSupply, 
            name, 
            symbol, 
            decimals, 
            tradeBurnRatio, 
            tradeFeeRatio,
            teamAccount,
            isMintable
        );

        _USER_CUSTOM_REGISTRY_[msg.sender].push(newCustomERC20);
        if(isMintable)
            emit NewERC20(newCustomERC20, msg.sender, 2);
        else 
            emit NewERC20(newCustomERC20, msg.sender, 1);
    }


    // ============ View ============
    function getTokenByUser(address user) 
        external
        view
        returns (address[] memory stds,address[] memory customs)
    {
        return (_USER_STD_REGISTRY_[user], _USER_CUSTOM_REGISTRY_[user]);
    }

    // ============ Ownable =============
    function changeCreateFee(uint256 newFee) external onlyOwner {
        _CREATE_FEE_ = newFee;
        emit ChangeCreateFee(newFee);
    }

    function withdraw() external onlyOwner {
        uint256 amount = address(this).balance;
        msg.sender.transfer(amount);
        emit Withdraw(msg.sender, amount);
    }

    function updateStdTemplate(address newStdTemplate) external onlyOwner {
        _ERC20_TEMPLATE_ = newStdTemplate;
        emit ChangeStdTemplate(newStdTemplate);
    }

    function updateCustomTemplate(address newCustomTemplate) external onlyOwner {
        _CUSTOM_ERC20_TEMPLATE_ = newCustomTemplate;
        emit ChangeCustomTemplate(newCustomTemplate);
    }
}
