exports.signState = async function (web3, amount, fromAccount0, account) {
	const encoded = web3.utils.soliditySha3(amount, fromAccount0);
	const signedMessage = await web3.eth.personal.sign(encoded, account);
	return signedMessage;
}

exports.faucetERC20 = async function (instance, account, callback) {
	try {
		var gasLimit = await instance.methods.faucet().estimateGas({
			from: account,
		});
	} catch (err) {
		console.error(err);
	}

	instance.methods.faucet().send({
		from: account,
		gas: gasLimit
	})
	.on('receipt', async (receipt) => {
		callback()
	})
}

exports.balanceOf = async function (instance, account) {
	return instance.methods.balanceOf(account).call()
}

exports.settleOnChain = async function (instance, account0, account1, amount, fromAccount0, signature0, signature1, account, callback) {
	try {
		var gasLimit = await instance.methods.validateReceipt(account0, account1, amount, fromAccount0, signature0, signature1).estimateGas({
			from: account,
		});
	} catch (err) {
		console.error(err);
	}

	instance.methods.validateReceipt(account0, account1, amount, fromAccount0, signature0, signature1).send({
		from: account,
		gas: parseInt(gasLimit*1.4)
	})
	.on('receipt', async (receipt) => {
		callback()
	})
}