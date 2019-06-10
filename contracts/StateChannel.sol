pragma solidity ^0.5.0;

import 'openzeppelin-solidity/contracts/token/ERC20/ERC20Mintable.sol';
import 'openzeppelin-solidity/contracts/cryptography/ECDSA.sol';

/// @title StateChannel contract
/// @author Andy Mpondo Black
/// @notice This contract is only used to complete the Closecross technical challenge
/// @dev This contract inherits from OpenZeppelin's contract ERC20Mintable and allows for state channel balance updates between 2 accounts
contract StateChannel is ERC20Mintable {

	using ECDSA for bytes32;

	/**
     * Event for balance update using the validateReceipt function
     * @param account Account address 
     * @param balance Account updated balance
     */
     event LogBalanceUpdate(address indexed account, uint balance);

	/**
     * @dev Constructor, mint 100000 tokens to contract address
     */
     constructor() public {
     	mint(address(this), 100000);
     }

	/**
     * @dev Function to send 1000 minted tokens to the sender account
     * @return A boolean that indicates if the operation was successful
     */
     function faucet() public returns (bool) {
     	_transfer(address(this), msg.sender, 1000);
     	return true;
     }

	/**
     * @dev Function to validate receipt and update balances accordingly
     * @param account0 First account of state channel
     * @param account1 Second account of state channel
     * @param amount Amount being exchanged between the two accounts
     * @param fromAccount0 Boolean indicating if the amount is sent by account0 or account1
     * @param signature0 Signature of the first account of state channel
     * @param signature1 Signature of the second account of state channel
     * @return A boolean that indicates if the operation was successful
     */
     function validateReceipt(
     	address account0,
     	address account1,
     	uint amount,
     	bool fromAccount0,
     	bytes memory signature0,
     	bytes memory signature1
     	) public returns (bool) {
     	require (amount > 0, "amount is negative or zero");

     	bytes32 message = keccak256(abi.encodePacked(amount, fromAccount0)).toEthSignedMessageHash();

     	require (message.recover(signature0) == account0, "signature0 invalid");
     	require (message.recover(signature1) == account1, "signature1 invalid"); 

     	if (fromAccount0) {
     		require (balanceOf(account0) >= amount, "balance not large enough");

     		_approve(account0, msg.sender, amount);
     		transferFrom(account0, account1, amount);
     	}
     	else {
     		require (balanceOf(account1) >= amount, "balance not large enough");  

     		_approve(account1, msg.sender, amount);
     		transferFrom(account1, account0, amount);
     	}

     	emit LogBalanceUpdate(account0, balanceOf(account0));
     	emit LogBalanceUpdate(account1, balanceOf(account1));
     	return true;
     }
 }