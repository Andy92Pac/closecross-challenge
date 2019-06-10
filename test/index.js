const StateChannel = artifacts.require('./../StateChannel.sol');
const { BN, expectEvent, expectRevert } = require('openzeppelin-test-helpers');
const EthUtil = require('ethereumjs-util');

async function signState (amount, fromAccount0, privateKey) {
	const encoded = web3.utils.soliditySha3(amount, fromAccount0);
	const signedMessage = await web3.eth.accounts.sign(encoded, privateKey);
	return signedMessage;
}

contract('StateChannel', ([owner, account0, account1, ...accounts]) => {

	var instance;

	var amount;
	var fromAccount0;
	var signedMessage0;
	var signedMessage1;

	// ACCOUNTS 1 AND 2 FROM FOLLOWING MNEMONIC
	// turkey museum identify return section guard page affair come private dilemma argue
	// ganache should be launched with following command
	// ganache-cli -m 'turkey museum identify return section guard page affair come privatdilemma argue'
	const publicKey0 = '0x32b36a49a8e2f5da9fb0fb0d5b3aff206c8aa730';
	const publicKey1 = '0x9a2a98e9539f999ceef6c5b65bd0721446f03d50';
	const privateKey0 = '0x5b72258a078305015a13c93cde7ca98feeb11681e3625bd0e3b835c000740485';
	const privateKey1 = '0xaa23fbc0a01a0f06c281ff51f0c7681228b211ebc8754b6aca450deb300fe361';

	before('setup', async () => {
		instance = await StateChannel.new({ from: owner });
	});

	it('should send 1000 tokens to account0 and account1', async () => {
		await instance.faucet({ from: account0 });
		await instance.faucet({ from: account1 });

		let tokenBalanceAccount0 = await instance.balanceOf(account0);
		let tokenBalanceAccount1 = await instance.balanceOf(account1);

		assert.deepEqual(tokenBalanceAccount0.toString(), '1000', 'Token balance account 0 incorrect');
		assert.deepEqual(tokenBalanceAccount1.toString(), '1000', 'Token balance account 1 incorrect');
	});

	it('should generate signature from account0 and account1', async () => {
		amount = '10';
		fromAccount0 = true;

		signedMessage0 = await signState(amount, fromAccount0, privateKey0);
		signedMessage1 = await signState(amount, fromAccount0, privateKey1);
		
		let signatureAccount0 = await web3.eth.accounts.recover(signedMessage0);
		let signatureAccount1 = await web3.eth.accounts.recover(signedMessage1);
		
		assert.deepEqual(signatureAccount0.toLowerCase(), account0.toLowerCase(), 'Incorrect account recovered from signature0');
		assert.deepEqual(signatureAccount1.toLowerCase(), account1.toLowerCase(), 'Incorrect account recovered from signature1');
	});

	it('should revert because signature is invalid', async () => {
		await expectRevert(
			instance.validateReceipt(
				account0,
				account1,
				amount, 
				fromAccount0,
				signedMessage0.signature,
				signedMessage0.signature, // Wrong signature, should be signature from account1
				{ from: account0 }),
			'signature1 invalid'
			);
	})

	it('should validate the receipt and update the balances on chain', async () => {
		let txReceipt = await instance.validateReceipt(
			account0, 
			account1, 
			amount, // 10
			fromAccount0, // true 
			signedMessage0.signature, 
			signedMessage1.signature, 
			{ from: account0 });

		await expectEvent.inTransaction(
			txReceipt.tx,
			StateChannel,
			'LogBalanceUpdate');

		let tokenBalanceAccount0 = await instance.balanceOf(account0);
		let tokenBalanceAccount1 = await instance.balanceOf(account1);

		assert.deepEqual(tokenBalanceAccount0.toString(), '990', 'Token balance account 0 incorrect');
		assert.deepEqual(tokenBalanceAccount1.toString(), '1010', 'Token balance account 1 incorrect');
	});

	it('should revert because balance is not large enough', async () => {
		amount = '10000';

		signedMessage0 = await signState(amount, fromAccount0, privateKey0);
		signedMessage1 = await signState(amount, fromAccount0, privateKey1);

		await expectRevert(
			instance.validateReceipt(
				account0,
				account1,
				amount, 
				fromAccount0,
				signedMessage0.signature,
				signedMessage0.signature,
				{ from: account0 }),
			'balance is not large enough'
			);
	})
})