import React, { Component } from "react";
import "./App.css";
import getWeb3 from "./getWeb3";
import { signState, faucetERC20, balanceOf, settleOnChain } from "./utils";
import StateChannelContract from "./contracts/StateChannel.json";

class App extends Component {
  constructor() {
    super();
    this.state = {
      web3: null,
      account: null,
      instance: null,
      account0: null,
      account1: null,
      balance0: 0,
      balance1: 0,
      amount: 0,
      fromAccount0: true,
      signature0: null,
      signature1: null,
      onChainBalance0: 0,
      onChainBalance1: 0,
      input0: '',
      input1: ''
    };
    this.setAccount0 = this.setAccount0.bind(this);
    this.setAccount1 = this.setAccount1.bind(this);
    this.updateAmount0 = this.updateAmount0.bind(this);
    this.updateAmount1 = this.updateAmount1.bind(this);
    this.signCurrentState0 = this.signCurrentState0.bind(this);
    this.signCurrentState1 = this.signCurrentState1.bind(this);
    this.getBalance = this.getBalance.bind(this);
    this.faucetAccount0 = this.faucetAccount0.bind(this);
    this.faucetAccount1 = this.faucetAccount1.bind(this);
    this.settle0 = this.settle0.bind(this);
    this.settle1 = this.settle1.bind(this);
  }
  componentDidMount = async () => {
    try {
      const web3 = await getWeb3();

      const accounts = await web3.eth.getAccounts();

      const networkId = await web3.eth.net.getId();
      const deployedNetwork = StateChannelContract.networks[networkId];

      var instance = null;
      if (deployedNetwork !== undefined) {
        instance = new web3.eth.Contract(
          StateChannelContract.abi,
          deployedNetwork && deployedNetwork.address
        );
      }

      web3.currentProvider.publicConfigStore.on("update", async () => {
        var accounts = await web3.eth.getAccounts();
        if (accounts[0] !== this.state.account) {
          this.setState({
            account: accounts[0]
          });
        }
      });

      this.setState({
        web3: web3,
        account: accounts[0],
        instance: instance,
      });
    } catch (error) {
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`
      );
      console.log(error);
    }
  };
  async setAccount0() {
    var balance = await this.getBalance(this.state.account);
      this.setState({
        balance0: balance,
        onChainBalance0: balance,
        account0: this.state.account
      })
  }
  async setAccount1() {
    var balance = await this.getBalance(this.state.account);
      this.setState({
        balance1: balance,
        onChainBalance1: balance,
        account1: this.state.account
      })
  }
  async updateAmount0() {
    if(this.state.account !== this.state.account0) {
      return alert('current account is not account0');
    }
    if(parseInt(this.state.input0) > parseInt(this.state.balance0)) {
      return alert('amount exceeds balance');
    }

    var newBalance0 = parseInt(this.state.balance0) - parseInt(this.state.input0);
    var newBalance1 = parseInt(this.state.balance1) + parseInt(this.state.input0);

    var amount, fromAccount0;

    if(newBalance1 > parseInt(this.state.onChainBalance1)) {
      amount = newBalance1 - parseInt(this.state.onChainBalance1);
      fromAccount0 = true;
    }
    else {
      amount = newBalance0 - parseInt(this.state.onChainBalance0);
      fromAccount0 = false;
    }

    var signature = await signState(this.state.web3, amount, fromAccount0, this.state.account0)

    this.setState({
      balance0: newBalance0,
      balance1: newBalance1,
      amount: amount,
      fromAccount0: fromAccount0,
      input0: '',
      signature0: signature
    })
  }
  async updateAmount1() {
    if(this.state.account !== this.state.account1) {
      return alert('current account is not account1');
    }
    if(parseInt(this.state.input1) > parseInt(this.state.balance1)) {
      return alert('amount exceeds balance');
    }

    var newBalance0 = parseInt(this.state.balance0) + parseInt(this.state.input1);
    var newBalance1 = parseInt(this.state.balance1) - parseInt(this.state.input1);

    var amount, fromAccount0;

    if(newBalance1 > parseInt(this.state.onChainBalance1)) {
      amount = newBalance1 - parseInt(this.state.onChainBalance1);
      fromAccount0 = true;
    }
    else {
      amount = newBalance0 - parseInt(this.state.onChainBalance0);
      fromAccount0 = false;
    }

    var signature = await signState(this.state.web3, amount, fromAccount0, this.state.account1)

    this.setState({
      balance0: newBalance0,
      balance1: newBalance1,
      amount: amount,
      fromAccount0: fromAccount0,
      input0: '',
      signature1: signature
    })
  }
  async signCurrentState0() {
    if(this.state.account !== this.state.account0) {
      return alert('current account is not account0');
    }
    var signature = await signState(this.state.web3, this.state.amount, this.state.fromAccount0, this.state.account0)

    this.setState({
      signature0: signature
    })
  }
  async signCurrentState1() {
    if(this.state.account !== this.state.account1) {
      return alert('current account is not account1');
    }
    var signature = await signState(this.state.web3, this.state.amount, this.state.fromAccount0, this.state.account1)

    this.setState({
      signature1: signature
    })
  }
  async getBalance(account) {
    var balance = await balanceOf(this.state.instance, account);
    return balance;
  }
  async faucetAccount0() {
    await faucetERC20(this.state.instance, this.state.account0, async () => {
      var balance = await this.getBalance(this.state.account0);
      this.setState({
        balance0: balance,
        onChainBalance0: balance
      })
    });
  }
  async faucetAccount1() {
    await faucetERC20(this.state.instance, this.state.account1, async () => {
      var balance = await this.getBalance(this.state.account1);
      this.setState({
        balance1: balance,
        onChainBalance1: balance
      })
    });
  }
  async settle0() {
    await settleOnChain(
      this.state.instance, 
      this.state.account0, 
      this.state.account1,
      this.state.amount,
      this.state.fromAccount0,
      this.state.signature0,
      this.state.signature1,
      this.state.account0,
      () => {
        alert('balances updated on chain');
      });
  }
  async settle1() {
    await settleOnChain(
      this.state.instance, 
      this.state.account0, 
      this.state.account1,
      this.state.amount,
      this.state.fromAccount0,
      this.state.signature0,
      this.state.signature1,
      this.state.account1,
      () => {
        alert('balances updated on chain');
      });
  }
  render() {
    return (
      <div className="App">
        <div className="account0">
          <button
            onClick={this.setAccount0}
          >
            Define current account as account0
          </button>
          <button onClick={() => this.faucetAccount0()}>
            Get ERC20 tokens from faucet
          </button>
          <input
            type="text"
            onChange={e => this.setState({ input0: e.target.value })}
            value={this.state.input0}
          />
          <button onClick={this.updateAmount0}>
            Send input amount to account1
          </button>
          <button
            onClick={this.signCurrentState0}
          >
            Sign current state
          </button>
          <button
            onClick={this.settle0}
          >
            Settle on-chain
          </button>
        </div>
        <div className="account1">
          <button
            onClick={this.setAccount1}
          >
            Define current account as account1
          </button>
          <button onClick={() => this.faucetAccount1()}>
            Get ERC20 tokens from faucet
          </button>
          <input
            type="text"
            onChange={e => this.setState({ input1: e.target.value })}
            value={this.state.input1}
          />
          <button onClick={this.updateAmount1}>
            Send input amount to account0
          </button>
          <button
            onClick={this.signCurrentState1}
          >
            Sign current state
          </button>
          <button
            onClick={this.settle1}
          >
            Settle on-chain
          </button>
        </div>
        <br/>
        <div>
          <span>
            Account0 : {this.state.account0}
          </span>
        </div>
        <div>
          <span>
            Account1 : {this.state.account1}
          </span>
        </div>
        <div>
          <span>
            Account0 balance : {this.state.balance0}
          </span>
        </div>
        <div>
          <span>
            Account1 balance : {this.state.balance1}
          </span>
        </div>
        <div>
          <span>
            Account0 signature : {this.state.signature0}
          </span>
        </div>
        <div>
          <span>
            Account1 signature : {this.state.signature1}
          </span>
        </div>
      </div>
    );
  }
}

export default App;
