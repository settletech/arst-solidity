// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

contract MultiSigWalletB {

    mapping(address => bool) public isOwner;
    uint256 public numConfirmationsRequired;
    address[] public owners;

    struct Transaction {
        address to;
        uint256 value;
        bytes data;
        bool executed;
        uint256 numConfirmations;
    }

    Transaction[] public transactions;
    // mapping from tx index => owner => bool
    mapping(uint256 => mapping(address => bool)) public isConfirmed;

    event Deposit(address indexed sender, uint256 amount, uint256 balance);
    event SubmitTransaction(
        address indexed owner,
        uint256 indexed txIndex,
        address indexed to,
        uint256 value,
        bytes data
    );
   
    event ConfirmTransaction(address indexed owner, uint256 indexed txIndex);
    event RevokeConfirmation(address indexed owner, uint256 indexed txIndex);
    event ExecuteTransaction(address indexed owner, uint256 indexed txIndex);
    event ExecuteOwnershipTransaction(address indexed owner, uint256 indexed txIndex);

    modifier onlyOwner() {
        require(isOwner[msg.sender], "not owner");
        _;
    }

    modifier onlyContract() {
        require(address(this) == msg.sender, "not owner");
        _;
    }

    modifier txExists(uint256 _txIndex) {
        require(_txIndex < transactions.length, "tx does not exist");
        _;
    }

    modifier notExecuted(uint256 _txIndex) {
        require(!transactions[_txIndex].executed, "tx already executed");
        _;
    }

    modifier notConfirmed(uint256 _txIndex) {
        require(!isConfirmed[_txIndex][msg.sender], "tx already confirmed");
        _;
    }

    constructor(address[] memory _owners, uint256 _numConfirmationsRequired) payable {
        require(_owners.length > 0, "owners required");
        require(
            _numConfirmationsRequired > 0
                && _numConfirmationsRequired <= _owners.length,
            "invalid number of required confirmations"
        );

        for (uint256 i = 0; i < _owners.length; i++) {
            address owner = _owners[i];

            require(owner != address(0), "invalid owner");
            require(!isOwner[owner], "owner not unique");

            isOwner[owner] = true;
            owners.push(owner);
        }

        numConfirmationsRequired = _numConfirmationsRequired;
    }

    function getBalance() external view returns (uint256){
        return address(this).balance;
    }

    receive() external payable {
        emit Deposit(msg.sender, msg.value, address(this).balance);
    }

    function submitTransaction(address _to, uint256 _value, bytes memory _data) public onlyOwner returns (uint256 transactionId) {
        uint256 txIndex = transactions.length;
        transactions.push(Transaction({
            to: _to,
            value: _value,
            data: _data,
            executed: false,
            numConfirmations: 1
        }));
        isConfirmed[txIndex][msg.sender] = true;
        emit SubmitTransaction(msg.sender, txIndex, _to, _value, _data);
        return txIndex;
    }

    function confirmTransaction(uint256 _txIndex)
        public
        onlyOwner
        txExists(_txIndex)
        notExecuted(_txIndex)
        notConfirmed(_txIndex)
    {
        Transaction storage transaction = transactions[_txIndex];
        transaction.numConfirmations += 1;
        isConfirmed[_txIndex][msg.sender] = true;

        emit ConfirmTransaction(msg.sender, _txIndex);
    }

    function executeTransaction(uint256 _txIndex)
        public
        onlyOwner
        txExists(_txIndex)
        notExecuted(_txIndex)
    {
        Transaction storage transaction = transactions[_txIndex];

        require(
            transaction.numConfirmations >= numConfirmationsRequired,
            "cannot execute tx"
        );

        transaction.executed = true;
       
        (bool success, ) = address(transaction.to).call{value: transaction.value}(transaction.data);
        require(success, "tx failed");
        
        emit ExecuteTransaction(msg.sender, _txIndex);
    }

    function revokeConfirmation(uint256 _txIndex)
        public
        onlyOwner
        txExists(_txIndex)
        notExecuted(_txIndex)
    {
        Transaction storage transaction = transactions[_txIndex];

        require(isConfirmed[_txIndex][msg.sender], "tx not confirmed");

        transaction.numConfirmations -= 1;
        isConfirmed[_txIndex][msg.sender] = false;

        emit RevokeConfirmation(msg.sender, _txIndex);
    }

    function getOwners() public view returns (address[] memory) {
        return owners;
    }

    // Functions for owner management
    function addOwner(address _owner) public onlyContract { 
        require(_owner != address(0), "invalid owner");
        require(!isOwner[_owner], "owner not unique");

        isOwner[_owner] = true;
        owners.push(_owner);
    }

    function removeOwner(address _owner) public onlyContract {
        require(isOwner[_owner], "not owner");

        isOwner[_owner] = false;
    }

    function changeRequirement(uint256 _numConfirmationsRequired) public onlyContract {
        require(_numConfirmationsRequired > 0, "invalid number of required confirmations"); 
        require(_numConfirmationsRequired <= owners.length, "invalid number of required confirmations");
        numConfirmationsRequired = _numConfirmationsRequired;
    }

    function getTransactionCount() public view returns (uint256) {
        return transactions.length;
    }

    function getTransaction(uint256 _txIndex)
        public
        view
        returns (
            address to,
            uint256 value,
            bytes memory data,
            bool executed,
            uint256 numConfirmations
        )
    {
        Transaction memory transaction = transactions[_txIndex];

        return (
            transaction.to,
            transaction.value,
            transaction.data,
            transaction.executed,
            transaction.numConfirmations
        );
    }
}