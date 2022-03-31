/*
    Copyright 2021 DODO ZOO.
    SPDX-License-Identifier: Apache-2.0
*/
pragma solidity 0.6.9;
pragma experimental ABIEncoderV2;

import {IERC20} from "../../intf/IERC20.sol";
import {UniversalERC20} from "../../SmartRoute/lib/UniversalERC20.sol";
import {SafeMath} from "../../lib/SafeMath.sol";
import {Address} from "../../external/utils/Address.sol";
import {ReentrancyGuard} from "../../lib/ReentrancyGuard.sol";
import {IRandomGenerator} from "../../lib/RandomGenerator.sol";
import {InitializableOwnable} from "../../lib/InitializableOwnable.sol";
import {InitializableMintableERC20} from "../../external/ERC20/InitializableMintableERC20.sol";

interface IDropsFeeModel {
    function getPayAmount(address dodoDrops, address user, uint256 originalPrice, uint256 ticketAmount) external view returns (uint256, uint256);
}

interface IDropsNft {
    function mint(address to, uint256 tokenId) external;
    function mint(address account, uint256 id, uint256 amount, bytes memory data) external;
}

contract DODODrops is InitializableMintableERC20, ReentrancyGuard {
    using SafeMath for uint256;
    using Address for address;
    using UniversalERC20 for IERC20;

    // ============ Storage ============
    address constant _BASE_COIN_ = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;
    
    address public _BUY_TOKEN_;
    uint256 public _BUY_TOKEN_RESERVE_;
    address public _FEE_MODEL_;
    address payable public _MAINTAINER_;
    address public _NFT_TOKEN_;

    uint256 public _TICKET_UNIT_ = 1; // ticket consumed in a single lottery
    
    uint256 [] public _SELLING_TIME_INTERVAL_;
    uint256 [] public _SELLING_PRICE_SET_;
    uint256 [] public _SELLING_AMOUNT_SET_;
    uint256 public _REDEEM_ALLOWED_TIME_;

    uint256[] public _PROB_INTERVAL_; // index => Interval probability (Only For ProbMode)  
    uint256[][] public _TOKEN_ID_MAP_; // Interval index => tokenIds (Only For ProbMode)
    
    uint256[] public _TOKEN_ID_LIST_; //index => tokenId (Only For FixedAmount mode)

    bool public _IS_PROB_MODE_; // false = FixedAmount mode,  true = ProbMode
    bool public _IS_REVEAL_MODE_;
    uint256 public _REVEAL_RN_ = 0; 
    address public _RNG_;

    bool public _CAN_TRANSFER_;

    fallback() external payable {}

    receive() external payable {}

    // ============ Modifiers ============

    modifier notStart() {
        require(block.timestamp < _SELLING_TIME_INTERVAL_[0] || _SELLING_TIME_INTERVAL_[0]  == 0, "ALREADY_START");
        _;
    }

    modifier buyTicketsFinish() {
        require(block.timestamp > _SELLING_TIME_INTERVAL_[_SELLING_TIME_INTERVAL_.length - 1] && _SELLING_TIME_INTERVAL_[0]  != 0, "BUY_TICKETS_NOT_FINISH");
        _;
    }

    modifier canTransfer() {
        require(_CAN_TRANSFER_, "DropsTickets: not allowed transfer");
        _;
    }

    // ============ Event =============
    event BuyTicket(address account, uint256 payAmount, uint256 feeAmount, uint256 ticketAmount);
    event RedeemPrize(address account, uint256 tokenId, address referer);

    event ChangeRNG(address rng);
    event ChangeRedeemTime(uint256 redeemTime);
    event ChangeTicketUnit(uint256 newTicketUnit);
    event Withdraw(address account, uint256 amount);
    event SetReveal();

    event SetSellingInfo();
    event SetProbInfo(); // only for ProbMode
    event SetTokenIdMapByIndex(uint256 index); // only for ProbMode
    event SetFixedAmountInfo(); // only for FixedAmount mode

    event SetCantransfer(bool allowed);


    function init(
        address[] memory addrList, //0 owner, 1 buyToken, 2 feeModel, 3 defaultMaintainer 4 rng 5 nftToken
        uint256[] memory sellingTimeInterval,
        uint256[] memory sellingPrice,
        uint256[] memory sellingAmount,
        uint256 redeemAllowedTime,
        bool isRevealMode,
        bool isProbMode
    ) public {
        _BUY_TOKEN_ = addrList[1];
        _FEE_MODEL_ = addrList[2];
        _MAINTAINER_ = payable(addrList[3]);
        _RNG_ = addrList[4];
        _NFT_TOKEN_ = addrList[5];

        _IS_REVEAL_MODE_ = isRevealMode;
        _IS_PROB_MODE_ = isProbMode;
        _REDEEM_ALLOWED_TIME_ = redeemAllowedTime;

        if(sellingTimeInterval.length > 0) _setSellingInfo(sellingTimeInterval, sellingPrice, sellingAmount);
        
        string memory prefix = "DROPS_";
        name = string(abi.encodePacked(prefix, addressToShortString(address(this))));
        symbol = name;
        decimals = 0;

        //init Owner
        super.init(addrList[0], 0, name, symbol, decimals);
    }

    function buyTickets(address ticketTo, uint256 ticketAmount) payable external preventReentrant {
        (uint256 curPrice, uint256 sellAmount, uint256 index) = getSellingInfo();
        require(curPrice > 0 && sellAmount > 0, "CAN_NOT_BUY");
        require(ticketAmount <= sellAmount, "TICKETS_NOT_ENOUGH");
        (uint256 payAmount, uint256 feeAmount) = IDropsFeeModel(_FEE_MODEL_).getPayAmount(address(this), ticketTo, curPrice, ticketAmount);
        require(payAmount > 0, "UnQualified");

        uint256 baseBalance = IERC20(_BUY_TOKEN_).universalBalanceOf(address(this));
        uint256 buyInput = baseBalance.sub(_BUY_TOKEN_RESERVE_);

        require(payAmount <= buyInput, "PAY_AMOUNT_NOT_ENOUGH");

        _SELLING_AMOUNT_SET_[index] = sellAmount.sub(ticketAmount);
        _BUY_TOKEN_RESERVE_ = baseBalance.sub(feeAmount);

        IERC20(_BUY_TOKEN_).universalTransfer(_MAINTAINER_,feeAmount);
        _mint(ticketTo, ticketAmount);
        emit BuyTicket(ticketTo, payAmount, feeAmount, ticketAmount);
    }

    function redeemTicket(uint256 ticketNum, address referer) external {
        // require(!address(msg.sender).isContract(), "ONLY_ALLOW_EOA");
        require(tx.origin == msg.sender, "ONLY_ALLOW_EOA");
        require(ticketNum >= 1 && ticketNum <= balanceOf(msg.sender), "TICKET_NUM_INVALID");
        _burn(msg.sender,ticketNum);
        for (uint256 i = 0; i < ticketNum; i++) {
            _redeemSinglePrize(msg.sender, i, referer);
        }
    }

    // ============ Internal  ============

    function _redeemSinglePrize(address to, uint256 curNo, address referer) internal {
        require(block.timestamp >= _REDEEM_ALLOWED_TIME_ && _REDEEM_ALLOWED_TIME_ != 0, "REDEEM_CLOSE");
        uint256 range;
        if(_IS_PROB_MODE_) {
            range = _PROB_INTERVAL_[_PROB_INTERVAL_.length - 1];
        }else {
            range = _TOKEN_ID_LIST_.length;
        }
        uint256 random;
        if(_IS_REVEAL_MODE_) {
            require(_REVEAL_RN_ != 0, "REVEAL_NOT_SET");
            random = uint256(keccak256(abi.encodePacked(_REVEAL_RN_, msg.sender, balanceOf(msg.sender).add(curNo + 1)))) % range;
        }else {
            random = IRandomGenerator(_RNG_).random(gasleft() + block.number) % range; 
        }
        uint256 tokenId;
        if(_IS_PROB_MODE_) {
            uint256 i;
            for (i = 0; i < _PROB_INTERVAL_.length; i++) {
                if (random <= _PROB_INTERVAL_[i]) {
                    break;
                }
            }
            require(_TOKEN_ID_MAP_[i].length > 0, "EMPTY_TOKEN_ID_MAP");
            tokenId = _TOKEN_ID_MAP_[i][random % _TOKEN_ID_MAP_[i].length];
            IDropsNft(_NFT_TOKEN_).mint(to, tokenId, 1, "");
        } else {
            tokenId = _TOKEN_ID_LIST_[random];
            if(random != range - 1) {
                _TOKEN_ID_LIST_[random] = _TOKEN_ID_LIST_[range - 1];
            }
            _TOKEN_ID_LIST_.pop();
            IDropsNft(_NFT_TOKEN_).mint(to, tokenId);  
        }
        emit RedeemPrize(to, tokenId, referer);
    }


    function _setSellingInfo(uint256[] memory sellingTimeIntervals, uint256[] memory sellingPrice, uint256[] memory sellingAmount) internal {
        require(sellingTimeIntervals.length > 0, "PARAM_NOT_INVALID");
        require(sellingTimeIntervals.length == sellingPrice.length && sellingPrice.length == sellingAmount.length, "PARAM_NOT_INVALID");
        for (uint256 i = 0; i < sellingTimeIntervals.length - 1; i++) {
            require(sellingTimeIntervals[i] < sellingTimeIntervals[i + 1], "INTERVAL_INVALID");
            require(sellingPrice[i] != 0, "PRICE_INVALID");
        }
        if(_IS_REVEAL_MODE_) {
            require(sellingAmount[sellingTimeIntervals.length - 1] == 0, "AMOUNT_INVALID");
            require(sellingPrice[sellingTimeIntervals.length - 1] == 0, "PRICE_INVALID");
        }
        _SELLING_TIME_INTERVAL_ = sellingTimeIntervals;
        _SELLING_PRICE_SET_ = sellingPrice;
        _SELLING_AMOUNT_SET_ = sellingAmount;
        emit SetSellingInfo();
    }


    function _setProbInfo(uint256[] memory probIntervals,uint256[][] memory tokenIdMap) internal {
        require(_IS_PROB_MODE_, "ONLY_ALLOW_PROB_MODE");
        require(probIntervals.length > 0, "PARAM_NOT_INVALID");
        require(tokenIdMap.length == probIntervals.length, "PARAM_NOT_INVALID");

        require(tokenIdMap[0].length > 0, "INVALID");
        for (uint256 i = 1; i < probIntervals.length; i++) {
            require(probIntervals[i] > probIntervals[i - 1], "INTERVAL_INVALID");
            require(tokenIdMap[i].length > 0, "INVALID");
        }
        _PROB_INTERVAL_ = probIntervals;
        _TOKEN_ID_MAP_ = tokenIdMap;
        emit SetProbInfo();
    }

    function _setFixedAmountInfo(uint256[] memory tokenIdList) internal {
        require(!_IS_PROB_MODE_, "ONLY_ALLOW_FIXED_AMOUNT_MODE");
        require(tokenIdList.length > 0, "PARAM_NOT_INVALID");
        _TOKEN_ID_LIST_ = tokenIdList;
        emit SetFixedAmountInfo();
    }


    function approve(address spender, uint256 amount) canTransfer public override returns (bool) {
        return super.approve(spender, amount);
    }

    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) canTransfer public override returns (bool) {
        return super.transferFrom(from, to, amount);
    }

    function transfer(address to, uint256 amount) canTransfer public override returns (bool) {
        return super.transfer(to, amount);
    }

    // ================= Owner ===================
    function setCantransfer(bool allowed) public onlyOwner {
        _CAN_TRANSFER_ = allowed;
        emit SetCantransfer(allowed);
    }

    function withdraw() external onlyOwner {
        uint256 amount = IERC20(_BUY_TOKEN_).universalBalanceOf(address(this));
        IERC20(_BUY_TOKEN_).universalTransfer(msg.sender ,amount);
        emit Withdraw(msg.sender, amount);
    }

    function setRevealRn() buyTicketsFinish external onlyOwner {
        require(_REVEAL_RN_ == 0, "ALREADY_SET");
        require(!_CAN_TRANSFER_, "NEED_CLOSE_TRANSFER");
        _REVEAL_RN_ = uint256(keccak256(abi.encodePacked(blockhash(block.number - 1))));
        emit SetReveal();
    }
    
    function setSellingInfo(uint256[] memory sellingTimeIntervals, uint256[] memory prices, uint256[] memory amounts) external notStart() onlyOwner {
        _setSellingInfo(sellingTimeIntervals, prices, amounts);
    }

    function setProbInfo(uint256[] memory probIntervals,uint256[][] memory tokenIdMaps) external notStart() onlyOwner {
        _setProbInfo(probIntervals, tokenIdMaps);
    }

    function setFixedAmountInfo(uint256[] memory tokenIdList) external notStart() onlyOwner {
        _setFixedAmountInfo(tokenIdList);
    }

    function addFixedAmountInfo(uint256[] memory addTokenIdList) external notStart() onlyOwner {
        for (uint256 i = 0; i < addTokenIdList.length; i++) {
            _TOKEN_ID_LIST_.push(addTokenIdList[i]);
        }
        emit SetFixedAmountInfo();
    }

    function setTokenIdMapByIndex(uint256 index, uint256[] memory tokenIds) external notStart() onlyOwner {
        require(_IS_PROB_MODE_, "ONLY_ALLOW_PROB_MODE");
        require(tokenIds.length > 0 && index < _TOKEN_ID_MAP_.length,"PARAM_NOT_INVALID");
        _TOKEN_ID_MAP_[index] = tokenIds;
        emit SetTokenIdMapByIndex(index);
    }
    
    function updateRNG(address newRNG) external onlyOwner {
        require(newRNG != address(0));
        _RNG_ = newRNG;
        emit ChangeRNG(newRNG);
    }

    function updateTicketUnit(uint256 newTicketUnit) external onlyOwner {
        require(newTicketUnit != 0);
        _TICKET_UNIT_ = newTicketUnit;
        emit ChangeTicketUnit(newTicketUnit);
    }

    function updateRedeemTime(uint256 newRedeemTime) external onlyOwner {
        require(newRedeemTime > block.timestamp || newRedeemTime == 0, "PARAM_NOT_INVALID");
        _REDEEM_ALLOWED_TIME_ = newRedeemTime;
        emit ChangeRedeemTime(newRedeemTime);
    }

    // ================= View ===================

    function getSellingStage() public view returns (uint256 stageLen) {
        stageLen = _SELLING_TIME_INTERVAL_.length;
    }

    function getSellingInfo() public view returns (uint256 curPrice, uint256 sellAmount, uint256 index) {
        uint256 curBlockTime = block.timestamp;
        if(curBlockTime >= _SELLING_TIME_INTERVAL_[0] && _SELLING_TIME_INTERVAL_[0] != 0) {
            uint256 i;
            for (i = 1; i < _SELLING_TIME_INTERVAL_.length; i++) {
                if (curBlockTime <= _SELLING_TIME_INTERVAL_[i]) {
                    break;
                }
            }
            curPrice = _SELLING_PRICE_SET_[i-1];
            sellAmount = _SELLING_AMOUNT_SET_[i-1];
            index = i - 1;
        }
    }

    function addressToShortString(address _addr) public pure returns (string memory) {
        bytes32 value = bytes32(uint256(_addr));
        bytes memory alphabet = "0123456789abcdef";

        bytes memory str = new bytes(8);
        for (uint256 i = 0; i < 4; i++) {
            str[i * 2] = alphabet[uint8(value[i + 12] >> 4)];
            str[1 + i * 2] = alphabet[uint8(value[i + 12] & 0x0f)];
        }
        return string(str);
    }
}
