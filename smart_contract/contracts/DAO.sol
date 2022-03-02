// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract DAO {
    struct Proposal {
        uint256 id;
        string name;
        uint256 amount;
        address payable recipient;
        uint256 votes;
        uint256 end;
        bool executed;
    }

    // Keep track of investor's contribution as well as their shares
    mapping(address => bool) public investors;
    mapping(address => uint256) public shares;
    mapping(address => mapping(uint256 => bool)) public votes;
    mapping(uint256 => Proposal) public proposals;

    uint256 public totalShares;
    uint256 public availableFunds;
    uint256 public contributionEnd;
    uint256 public nextProposalId;
    uint256 public voteTime;
    uint256 public quorum;
    address public admin;

    constructor(
        uint256 _contributionTime,
        uint256 _voteTime,
        uint256 _quorum
    ) {
        require(_quorum > 0 && _quorum < 100, "Quorum must be between 0-100");
        contributionEnd = block.timestamp + _contributionTime;
        voteTime = _voteTime;
        admin = msg.sender;
    }

    function contribute() external payable {
        require(block.timestamp < contributionEnd, "DAO has ended.");
        investors[msg.sender] = true;
        shares[msg.sender] += msg.value;
        totalShares += msg.value;
        availableFunds += msg.value;
    }

    function redeemShare(uint256 _amount) external {
        require(shares[msg.sender] >= _amount, "Insufficient shares");
        require(availableFunds >= _amount, "Insufficient funds");
        shares[msg.sender] -= _amount;
        availableFunds -= _amount;
        payable(msg.sender).transfer(_amount);
    }

    function transferShare(uint256 _amount, address _to) external {
        require(shares[msg.sender] >= _amount, "Insufficient shares");
        shares[msg.sender] -= _amount;
        shares[_to] += _amount;
        investors[_to] = true;
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "Must be admin to access this feature");
        _;
    }

    modifier onlyInvestors() {
        require(
            investors[msg.sender] == true,
            "Must be an investor to access this feature"
        );
        _;
    }

    receive() external payable {
        availableFunds += msg.value;
    }

    function createProposal(
        string memory _name,
        uint256 _amount,
        address payable _recipient
    ) public onlyInvestors {
        require(availableFunds >= _amount, "Insufficient funds");
        proposals[nextProposalId] = Proposal(
            nextProposalId,
            _name,
            _amount,
            _recipient,
            0,
            block.timestamp + voteTime,
            false
        );
        availableFunds -= _amount;
        nextProposalId++;
    }

    function withdraw(uint256 _amount, address payable _to) external onlyAdmin {
        _transferEther(_amount, _to);
    }

    function _transferEther(uint256 _amount, address payable _recipient)
        internal
    {
        require(_amount <= availableFunds, "Insufficient funds");
        availableFunds -= _amount;
        _recipient.transfer(_amount);
    }

    function vote(uint256 _proposalId) external onlyInvestors {
        Proposal storage proposal = proposals[_proposalId];
        require(
            votes[msg.sender][_proposalId] == false,
            "Investor can only vote once per proposal"
        );
        require(
            block.timestamp < proposal.end,
            "Can only vote when polling is open"
        );
        proposal.votes += shares[msg.sender];
    }

    function executeProposal(uint256 _proposalId) external onlyAdmin {
        Proposal storage proposal = proposals[_proposalId];
        require(
            block.timestamp >= proposal.end,
            "Cannot execute before end date"
        );
        require(
            proposal.executed == false,
            "Cannot execute proposals that has already been executed"
        );
        require(
            (proposal.amount / totalShares) * 100 >= quorum,
            "Can not execute proposal with votes # below quorum"
        );
        _transferEther(proposal.amount, proposal.recipient);
    }
}
