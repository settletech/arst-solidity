// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract TokenVault is Ownable, AccessControl { 
    IERC20 public token;
    bytes32 public constant VAULTOWNER_ROLE = keccak256("VAULTOWNER_ROLE"); 

    constructor(IERC20 _token) Ownable(msg.sender) {
        token = _token;
        _grantRole(VAULTOWNER_ROLE, msg.sender);
    }

    function transfer(address _recipient, uint256 _amount) public onlyRole(VAULTOWNER_ROLE) { 
        require(token.transfer(_recipient, _amount), "Transfer failed");
    }

    function getBalance() public view returns (uint256) {
        return token.balanceOf(address(this));
    }
}