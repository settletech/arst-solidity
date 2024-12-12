// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract StableToken is ERC20, ERC20Burnable, ERC20Pausable, Ownable, AccessControl {

    bytes32 public constant MULTISIG_ROLE = keccak256("MULTISIG_ROLE"); 

    constructor()
        ERC20("StableToken", "STT") 
        Ownable(_msgSender())
    {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function transferOwnership(address newOwner) public override onlyOwner {
        require(newOwner != address(0), "Invalid new owner address.");
        _transferOwnership(newOwner);
    }

    function transfer(address recipient, uint256 amount)
        public
        virtual
        override
        whenNotPaused
        returns (bool)
    {
        require(_msgSender() != address(0), "ERC20: transfer from the zero address");
        require(_msgSender() != address(0), "ERC20: transfer to the zero address");
        
         super._transfer(_msgSender(), recipient, amount);
        return true;
    }

    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) public virtual override whenNotPaused returns (bool) {
        super.transferFrom(sender, recipient, amount);
        return true;
    }

    function mint(address to, uint256 amount) public onlyRole(MULTISIG_ROLE) {
        super._mint(to, amount);
    }

    function addMinter(address newMinter) external onlyOwner {
        _grantRole(MULTISIG_ROLE, newMinter);
    }

    function burn(address account, uint256 amount) internal virtual {
        require(account != address(0), "ERC20: burn from the zero address");
        super._burn(account, amount); 
    }

    function pause() public onlyRole(MULTISIG_ROLE) {
        _pause();
    }

    function unpause() public onlyRole(MULTISIG_ROLE) {
        _unpause();
    }

    // Override _update
    function _update(address from, address to, uint256 amount) internal override(ERC20, ERC20Pausable) {
        super._update(from, to, amount);
    }

}