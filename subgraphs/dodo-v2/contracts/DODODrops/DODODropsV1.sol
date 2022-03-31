/*
    Copyright 2020 DODO ZOO.
    SPDX-License-Identifier: Apache-2.0
*/
pragma solidity 0.6.9;
pragma experimental ABIEncoderV2;

import {IERC20} from "../intf/IERC20.sol";
import {SafeERC20} from "../lib/SafeERC20.sol";
import {SafeMath} from "../lib/SafeMath.sol";
import {IRandomGenerator} from "../lib/RandomGenerator.sol";
import {InitializableOwnable} from "../lib/InitializableOwnable.sol";
import {Address} from "../external/utils/Address.sol";
import {ERC721URIStorage} from "../external/ERC721/ERC721URIStorage.sol";

contract DODODropsV1 is ERC721URIStorage, InitializableOwnable {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;
    using Address for address;

    // ============ Storage ============

    mapping(address => uint256) _USER_TICKETS_;
    uint256 public _TOTAL_TICKETS_;
    
    uint256 public _CUR_SELLING_TICKETS_;
    uint256 public _CUR_PRCIE_;
    uint256 public _TICKET_UNIT_ = 1; // ticket consumed in a single lottery

    uint256[] public _TOKEN_IDS_;

    address public _RANDOM_GENERATOR_;

    bool public _REDEEM_ALLOWED_ = true;


    // ============ Event =============
    event ChangeRandomGenerator(address randomGenerator);
    event ChangeTicketUnit(uint256 newTicketUnit);
    event ChangeSellingInfo(uint256 curSellingTickets, uint256 curPrice);
    event Withdraw(address account, uint256 amount);
    event BatchMint(uint256 mintAmount);
    event BuyTicket(address account, uint256 value, uint256 tickets);
    event RedeemPrize(address account, uint256 tokenId);
    event DisableRedeem();
    event EnableRedeem();

    fallback() external payable {}

    receive() external payable {}

    function init(
        string memory name,
        string memory symbol,
        string memory baseUri,
        address owner,
        address randomGenerator
    ) external {
        require(owner != address(0));

        _name = name;
        _symbol = symbol;
        _baseUri = baseUri;

        initOwner(owner);
        _RANDOM_GENERATOR_ = randomGenerator;
    }

    function buyTicket() payable external {
        uint256 buyAmount = msg.value;
        require(buyAmount >= _CUR_PRCIE_, "BNB_NOT_ENOUGH");
        uint256 tickets = buyAmount.div(_CUR_PRCIE_);
        require(tickets <= _CUR_SELLING_TICKETS_, "TICKETS_NOT_ENOUGH");
        _USER_TICKETS_[msg.sender] = _USER_TICKETS_[msg.sender].add(tickets);
        _TOTAL_TICKETS_ = _TOTAL_TICKETS_.add(tickets);
        _CUR_SELLING_TICKETS_ = _CUR_SELLING_TICKETS_.sub(tickets);

        uint256 leftOver = msg.value - tickets.mul(_CUR_PRCIE_);
        if(leftOver > 0) 
            msg.sender.transfer(leftOver);
        emit BuyTicket(msg.sender, buyAmount - leftOver, tickets);
    }


    function redeemPrize(uint256 ticketNum) external {
        require(_REDEEM_ALLOWED_, "REDEEM_CLOSED");
        // require(!address(msg.sender).isContract(), "ONLY_ALLOW_EOA");
        require(tx.origin == msg.sender, "ONLY_ALLOW_EOA");
        require(ticketNum >= 1 && ticketNum <= _USER_TICKETS_[msg.sender], "TICKET_NUM_INVALID");
        _USER_TICKETS_[msg.sender] = _USER_TICKETS_[msg.sender].sub(ticketNum);
        _TOTAL_TICKETS_ = _TOTAL_TICKETS_.sub(ticketNum);
        for (uint256 i = 0; i < ticketNum; i++) {
            _redeemSinglePrize(msg.sender);
        }
    }

    // ================= View ===================
    function getTickets(address account) view external returns(uint256) {
        return _USER_TICKETS_[account];
    }

    // =============== Internal  ================

    function _redeemSinglePrize(address to) internal {
        uint256 range = _TOKEN_IDS_.length;
        uint256 random = IRandomGenerator(_RANDOM_GENERATOR_).random(gasleft()) % range;
        uint256 prizeId = _TOKEN_IDS_[random];

        if(random != range - 1) {
            _TOKEN_IDS_[random] = _TOKEN_IDS_[range - 1];
        }
        _TOKEN_IDS_.pop();
        _safeTransfer(address(this), to, prizeId, "");
        emit RedeemPrize(to, prizeId);
    }

    // ================= Owner ===================

    function disableRedeemPrize() external onlyOwner {
        _REDEEM_ALLOWED_ = false;
        emit DisableRedeem();
    }

    function enableRedeemPrize() external onlyOwner {
        _REDEEM_ALLOWED_ = true;
        emit EnableRedeem();
    }

    function updateRandomGenerator(address newRandomGenerator) external onlyOwner {
        require(newRandomGenerator != address(0));
        _RANDOM_GENERATOR_ = newRandomGenerator;
        emit ChangeRandomGenerator(newRandomGenerator);
    }

    function updateSellingInfo(uint256 newSellingTickets, uint256 newPrice) external onlyOwner {
        _CUR_SELLING_TICKETS_ = newSellingTickets;
        _CUR_PRCIE_ = newPrice;
        emit ChangeSellingInfo(newSellingTickets, newPrice);
    }

    function updateTicketUnit(uint256 newTicketUnit) external onlyOwner {
        require(newTicketUnit != 0);
        _TICKET_UNIT_ = newTicketUnit;
        emit ChangeTicketUnit(newTicketUnit);
    }

    function withdraw() external onlyOwner {
        uint256 amount = address(this).balance;
        msg.sender.transfer(amount);
        emit Withdraw(msg.sender, amount);
    }

    function batchMint(uint256[] calldata ids, string[] calldata urls) external onlyOwner {
        for(uint256 i = 0; i < ids.length; i++) {
            _mint(address(this), ids[i]);
            _TOKEN_IDS_.push(ids[i]);
            _setTokenURI(ids[i], urls[i]);
        }
        emit BatchMint(ids.length);
    }
}
