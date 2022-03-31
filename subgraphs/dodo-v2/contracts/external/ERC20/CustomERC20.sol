/*

    Copyright 2022 DODO ZOO.
    SPDX-License-Identifier: Apache-2.0

*/

pragma solidity 0.6.9;

import {SafeMath} from "../../lib/SafeMath.sol";
import {InitializableOwnable} from "../../lib/InitializableOwnable.sol";

contract CustomERC20 is InitializableOwnable {
    using SafeMath for uint256;

    string public name;
    uint8 public decimals;
    string public symbol;
    uint256 public totalSupply;

    uint256 public tradeBurnRatio;
    uint256 public tradeFeeRatio;
    address public team;

    mapping(address => uint256) balances;
    mapping(address => mapping(address => uint256)) internal allowed;

    event Transfer(address indexed from, address indexed to, uint256 amount);
    event Approval(address indexed owner, address indexed spender, uint256 amount);

    event ChangeTeam(address oldTeam, address newTeam);


    function init(
        address _creator,
        uint256 _totalSupply,
        string memory _name,
        string memory _symbol,
        uint8 _decimals,
        uint256 _tradeBurnRatio,
        uint256 _tradeFeeRatio,
        address _team
    ) public {
        initOwner(_creator);
        name = _name;
        symbol = _symbol;
        decimals = _decimals;
        totalSupply = _totalSupply;
        balances[_creator] = _totalSupply;
        require(_tradeBurnRatio >= 0 && _tradeBurnRatio <= 5000, "TRADE_BURN_RATIO_INVALID");
        require(_tradeFeeRatio >= 0 && _tradeFeeRatio <= 5000, "TRADE_FEE_RATIO_INVALID");
        tradeBurnRatio = _tradeBurnRatio;
        tradeFeeRatio = _tradeFeeRatio;
        team = _team;
        emit Transfer(address(0), _creator, _totalSupply);
    }

    function transfer(address to, uint256 amount) public returns (bool) {
        _transfer(msg.sender,to,amount);
        return true;
    }

    function balanceOf(address owner) public view returns (uint256 balance) {
        return balances[owner];
    }

    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) public returns (bool) {
        require(amount <= allowed[from][msg.sender], "ALLOWANCE_NOT_ENOUGH");
        _transfer(from,to,amount);
        allowed[from][msg.sender] = allowed[from][msg.sender].sub(amount);
        return true;
    }

    function approve(address spender, uint256 amount) public returns (bool) {
        allowed[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function allowance(address owner, address spender) public view returns (uint256) {
        return allowed[owner][spender];
    }


    function _transfer(
        address sender,
        address recipient,
        uint256 amount
    ) internal virtual {
        require(sender != address(0), "ERC20: transfer from the zero address");
        require(recipient != address(0), "ERC20: transfer to the zero address");
        require(balances[sender] >= amount, "ERC20: transfer amount exceeds balance");

        balances[sender] = balances[sender].sub(amount);

        uint256 burnAmount;
        uint256 feeAmount;
        if(tradeBurnRatio > 0) {
            burnAmount = amount.mul(tradeBurnRatio).div(10000);
            balances[address(0)] = balances[address(0)].add(burnAmount);
            emit Transfer(sender, address(0), burnAmount);
        }

        if(tradeFeeRatio > 0) {
            feeAmount = amount.mul(tradeFeeRatio).div(10000);
            balances[team] = balances[team].add(feeAmount);
            emit Transfer(sender, team, feeAmount);
        }
        
        uint256 receiveAmount = amount.sub(burnAmount).sub(feeAmount);
        balances[recipient] = balances[recipient].add(receiveAmount);

        emit Transfer(sender, recipient, receiveAmount);
    }


    //=================== Ownable ======================
    function changeTeamAccount(address newTeam) external onlyOwner {
        require(tradeFeeRatio > 0, "NOT_TRADE_FEE_TOKEN");
        emit ChangeTeam(team,newTeam);
        team = newTeam;
    }

    function abandonOwnership(address zeroAddress) external onlyOwner {
        require(zeroAddress == address(0), "NOT_ZERO_ADDRESS");
        emit OwnershipTransferred(_OWNER_, address(0));
        _OWNER_ = address(0);
    }
}
