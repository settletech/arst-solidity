// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
// import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
// import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

contract StableToken is ERC20, Ownable, Pausable, ERC20Permit {

    constructor()
        ERC20("StableToken", "STT") 
        Ownable(_msgSender())
        ERC20Permit("StableToken")
    { }

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

    function mint(address to, uint256 amount) whenNotPaused public onlyOwner {
        super._mint(to, amount);
    }

    // Only called by settle even if paused.
    function burn(uint256 _amount) public onlyOwner {
        require(_amount > 0, "amount should be greater than zero");
        super._burn(msg.sender, _amount);
    }

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    // Override _update
    /*function _update(address from, address to, uint256 amount) internal override(ERC20, ERC20Pausable) {
        super._update(from, to, amount);
    } */

}
