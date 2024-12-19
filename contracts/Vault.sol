// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TokenVault is Ownable { 
    IERC20 public token;

    constructor(IERC20 _token) Ownable(msg.sender) {
        token = _token;
    }

    function deposit(uint256 _amount) public {
        require(token.transferFrom(msg.sender, address(this), _amount), "Transfer failed");
    }

    function withdraw(address _recipient, uint256 _amount) public onlyOwner { 
        require(token.transfer(_recipient, _amount), "Transfer failed");
    }

    function getBalance() public view returns (uint256) {
        return token.balanceOf(address(this));
    }
}