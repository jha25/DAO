/** @format */

import React, { useState, useEffect } from "react"
import "./App.css"
import { ethers } from "ethers"

import { contractABI, contractAddress } from "./utils/constants"

function App() {
	const [currentAccount, setCurrentAccount] = useState()
	const [contract, setContract] = useState()
  const [admin, setAdmin] = useState()
  const [shares, setShares] = useState()
  const [proposals, setProposals] = useState([])


	const deploy = async () => {
		try {
			const { ethereum } = window

			if (ethereum) {
				const provider = new ethers.providers.Web3Provider(ethereum)
				console.log(`Provider: ${provider}`)
				const signer = provider.getSigner()
				console.log(`Signer: ${signer}`)
				const contract = new ethers.Contract(
					contractAddress,
					contractABI,
					signer,
				)
				console.log(`Contract: ${{...contract}}`)
				setContract(contract)

        const availableTransaction = await contract.map((transaction) => transaction)
        console.log(availableTransaction)
			}
		} catch (error) {
			console.error(error)
		}
	}

	const checkWalletIsConnected = async () => {
		const { ethereum } = window

		if (!ethereum) {
			console.log("Please install Metamask")
			return
		} else {
			console.log("Wallet is connected")
		}

		const accounts = await ethereum.request({ method: "eth_accounts" })

		if (accounts.length !== 0) {
			const account = accounts[0]
			console.log("Account: ", account)
			setCurrentAccount(account)
		} else {
			console.log("No account found")
		}
	}

	const connectWallet = async () => {
		const { ethereum } = window

		if (!ethereum) {
			alert("Please install Metamask")
		}
		try {
			const accounts = await ethereum.request({ method: "eth_requestAccounts" })
			console.log("Account: ", accounts[0])
			setCurrentAccount(accounts[0])
		} catch (error) {
			console.error(error)
		}
	}

	const connectWalletButton = () => {
		return (
			<button
				onClick={connectWallet}
				className='cta-button connect-wallet-button'>
				Connect Wallet
			</button>
		)
	}

  const updateShares = async() => {
    const shares = await contract.shares(currentAccount)
    console.log(shares)
    setShares(shares)
  }

  const updateProposals = async() => {
    const nextProposalId = parseInt(await contract.nextProposalId())
    const proposals =[];
    for(let i = 0; i < nextProposalId; i++){
      const [proposal, hasVoted] = await Promise.all([contract.proposals(i), contract.votes(currentAccount, i)])
        proposals.push({...proposal, hasVoted})
    }
    setProposals(proposals)
  }

  const executeProposal = async(proposalId) => {
    await contract.executeProposal(proposalId)
    await updateProposals()
  }

  const withdrawEther = async(e) => {
    e.preventDefault()
    const amount = e.target.elements[0].value
    const to = e.target.elements[1].value
    await contract.withdraw(amount, to)
  }

  const contribute = async(e) => {
    e.preventDefault()
    const amount = e.target.elements[0].value
    await contract.contribute()
  }

  const redeemShares = async(e) => {
    e.preventDefault()
    const amount = e.target.elements[0].value
    await contract.redeemShares(amount)
    await updateShares()
  }

  const transferShares = async(e) => {
    e.preventDefault()
    const amount = e.target.elements[0].value
    await contract.redeemShares(amount)
    await updateShares()
  }

  const vote = async(ballotId) => {
    await contract.vote(ballotId)
    await updateProposals()
  }

  const createProposal = async(e) => {
    e.preventDefault()
    const name = e.target.elements[0].value
    const amount = e.target.elements[1].value
    const recipient = e.target.elements[2].value
    await contract.createProposal(name, amount, recipient)
    await updateProposals()
  }

  const isFinished = (proposal) => {
    const now = new Date().getTime()
    const proposalEnd = new Date(parseInt(proposal.end) * 1000)
    return (proposalEnd > now) > 0 ? false : true
  }

	useEffect(() => {
		checkWalletIsConnected()
		deploy()
	}, [])

	return (
		<div className='App'>
			<h1>DAO</h1>

			<div>{connectWalletButton()}</div>

      <p> Shares: {shares} </p>

      {currentAccount.toLowerCase() === admin.toLowerCase()? (
        <>
        <div className='row'>
        <div className='col-sm-12'>
        <h2> Withdraw ether</h2>
        <form onSubmit={e => withdrawEther(e)}>
              <div className="form-group">
                <label htmlFor="amount">Amount</label>
                <input type="text" className="form-control" id="amount" />
              </div>
              <div className="form-group">
                <label htmlFor="to">To</label>
                <input type="text" className="form-control" id="to" />
              </div>
              <button type="submit" className="btn btn-primary">Submit</button>
            </form>
          </div>
        </div>
        </>
      ): null }
      <div className="row">
        <div className="col-sm-12">
          <h2>Contribute</h2>
          <form onSubmit={e => contribute(e)}>
            <div className="form-group">
              <label htmlFor="amount">Amount</label>
              <input type="text" className="form-control" id="amount" />
            </div>
            <button type="submit" className="btn btn-primary">Submit</button>
          </form>
        </div>
      </div>

      <hr/>

      <div className="row">
        <div className="col-sm-12">
          <h2>Redeem shares</h2>
          <form onSubmit={e => redeemShares(e)}>
            <div className="form-group">
              <label htmlFor="amount">Amount</label>
              <input type="text" className="form-control" id="amount" />
            </div>
            <button type="submit" className="btn btn-primary">Submit</button>
          </form>
        </div>
      </div>

      <hr/>

      <div className="row">
        <div className="col-sm-12">
          <h2>Transfer shares</h2>
          <form onSubmit={e => transferShares(e)}>
            <div className="form-group">
              <label htmlFor="amount">Amount</label>
              <input type="text" className="form-control" id="amount" />
            </div>
            <button type="submit" className="btn btn-primary">Submit</button>
          </form>
        </div>
      </div>

      <hr/>

      <div className="row">
        <div className="col-sm-12">
          <h2>Create proposal</h2>
          <form onSubmit={e => createProposal(e)}>
            <div className="form-group">
              <label htmlFor="name">Name</label>
              <input type="text" className="form-control" id="name" />
            </div>
            <div className="form-group">
              <label htmlFor="amount">Amount</label>
              <input type="text" className="form-control" id="amount" />
            </div>
            <div className="form-group">
              <label htmlFor="recipient">Recipient</label>
              <input type="text" className="form-control" id="recipient" />
            </div>
            <button type="submit" className="btn btn-primary">Submit</button>
          </form>
        </div>
      </div>

      <hr/>

      <div className="row">
        <div className="col-sm-12">
          <h2>Proposals</h2>
          <table className="table">
            <thead>
              <tr>
                <th>Id</th>
                <th>Name</th>
                <th>Amount</th>
                <th>Recipient</th>
                <th>Votes</th>
                <th>Vote</th>
                <th>Ends on</th>
                <th>Executed</th>
              </tr>
            </thead>
            <tbody>
              {proposals.map(proposal => (
                <tr key={proposal.id}>
                  <td>{proposal.id}</td>
                  <td>{proposal.name}</td>
                  <td>{proposal.amount}</td>
                  <td>{proposal.recipient}</td>
                  <td>{proposal.votes}</td>
                  <td>
                    {isFinished(proposal) ? 'Vote finished' : (
                      proposal.hasVoted ? 'You already voted' : ( 
                      <button 
                        onClick={e => vote(proposal.id)}
                        type="submit" 
                        className="btn btn-primary">
                        Vote
                      </button>
                    ))}
                  </td>
                  <td>
                    {(new Date(parseInt(proposal.end) * 1000)).toLocaleString()}
                  </td>
                  <td>
                    {proposal.executed ? 'Yes' : (
                      admin.toLowerCase() === currentAccount.toLowerCase() ? (
                        <button 
                          onClick={e => executeProposal(proposal.id)}
                          type="submit" 
                          className="btn btn-primary">
                          Execute
                        </button>
                      ) : 'No' 
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
		</div>
	)
}

export default App
