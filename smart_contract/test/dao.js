/** @format */

const { expectRevert, time } = require("@openzeppelin/test-helpers")
const DAO = artifacts.require("DAO")

contract("DAO", (accounts) => {
	let dao

	const [investor1, investor2, investor3] = [
		accounts[1],
		accounts[2],
		accounts[3],
	]
	console.log(investor1, investor2, investor3)

	before(async () => {
		dao = await DAO.new(2, 2, 50)
	})

	it("Should accept contribution", async () => {
		await dao.contribute({ from: investor1, value: 100 })
		await dao.contribute({ from: investor2, value: 200 })
		await dao.contribute({ from: investor3, value: 300 })

		const shares1 = await dao.shares(investor1)
		const shares2 = await dao.shares(investor2)
		const shares3 = await dao.shares(investor3)
		const isInvestor1 = await dao.investors(investor1)
		const isInvestor2 = await dao.investors(investor2)
		const isInvestor3 = await dao.investors(investor3)
		const totalShares = await dao.totalShares()
		const availableFunds = await dao.availableFunds()

		assert(shares1.toNumber() === 100)
		assert(shares2.toNumber() === 200)
		assert(shares3.toNumber() === 300)
		assert(isInvestor1 === true)
		assert(isInvestor2 === true)
		assert(isInvestor3 === true)
		assert(totalShares.toNumber() === 600)
		assert(availableFunds.toNumber() === 600)
	})

	it("Should not accept contribution after set time", async () => {
		await time.increase(2001)
		await expectRevert(
			dao.contribute({ from: investor1, value: 100 }),
			"Can not contribute after set time has passed.",
		)
	})

	it("Should create proposal", async () => {
		await dao.createProposal("proposal 1", 100, accounts[8], {
			from: investors1,
		})
		const proposal = await dao.proposals(0)
		assert(proposal.name === "proposal 1")
		assert(proposal.amount.toNumber() === 100)
		assert(proposal.votes.toNumber() === 0)
		assert(proposal.executed === false)
	})

	it("Should not create a proposal if not initiated by an investor", async () => {
		await expectRevert(
			dao.createProposal("proposal 2", 10, accounts[8], { from: accounts[5] }),
			"Only investor has access to this feature.",
		)
	})

	it("Should not create proposal if amount exceeds limit", async () => {
		await expectRevert(
			dao.createProposal("proposal 2", 1000, accounts[8], { from: investor1 }),
			"Amount exceeds available funds.",
		)
	})

	it("Should vote", async () => {
		await dao.vote(0, { from: investor1 })
	})

	it("Should not vote if not an investor", async () => {
		await expectRevert(
			dao.vote(0, { from: accounts[8] }),
			"Only investor can access this feature.",
		)
	})

	it("Should not vote if after proposal end date", async () => {
		await time.increase(2001)
		await expectRevert(dao.vote(0, { from: investor1 })),
			"Investor can only vote once a proposal."
	})

	it("Should execute proposal", async () => {
		await dao.createProposal("proposal 2", 100, accounts[8], {
			from: investor1,
		})
		await dao.vote(1, { from: investor1 })
		await dao.vote(1, { from: investor3 })
		await time.increase(2001)
		await dao.executeProposal(1)
	})

	it("Should not execute proposal if not enough votes", async () => {
		await dao.createProposal("proposal 3", 100, accounts[8], {
			from: investor1,
		})
		await dao.vote(2, { from: investor1 })
		await time.increase(2001)
		await expectRevert(
			dao.executeProposal(2),
			"Can not execute proposal with votes # below quorum.",
		)
	})

	it("Should not execute a proposal twice", async () => {
		await expectRevert(
			dao.executeProposal(1),
			"Proposal has already been executed.",
		)
	})

	it("Should not execute proposal before end date", async () => {
		await dao.createProposal("proposal 4", 50, accounts[8], { from: investor1 })
		await dao.vote(3, { from: investor1 })
		await dao.vote(3, { from: investor2 })
		expectRevert(
			dao.executeProposal(3),
			"Cannot execute proposal before end date.",
		)
	})

	it("Should withdraw ether", async () => {
		const initialBalance = await web3.eth.getBalance(accounts[8])
		await dao.withdrawEther(10, accounts[8])
		const finalBalance = await web3.eth.getBalance(accounts[8])
		finalBalanceBN = web3.utils.toBN(finalBalance)
		initialBalanceBN = web3.utils.toBN(initialBalance)
		assert(finalBalanceBN.sub(initialBalanceBN).toNumber() === 10)
	})

	it("Should not withdraw ether if not admin", async () => {
		await expectRevert(
			dao.withdrawEther(10, accounts[8], { from: investor1 }),
			"Only admin has access to this feature.",
		)
	})

	it("Should not withdraw ether if trying to withdraw too much", async () => {
		await expectRevert(
			dao.withdrawEther(1000, accounts[8]),
			"Insufficient funds.",
		)
	})
})
