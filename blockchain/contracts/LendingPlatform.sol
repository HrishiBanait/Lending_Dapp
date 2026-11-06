// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract LendingPlatform {
    enum Status { Available, Requested, Approved, Rejected }

    struct LoanOffer {
        uint256 id;
        address lender;
        address borrower; // zero address until someone requests
        uint256 amount;   // plain number; no real funds are transferred
        Status status;
    }

    LoanOffer[] private offers;

    event OfferCreated(uint256 indexed id, address indexed lender, uint256 amount);
    event LoanRequested(uint256 indexed id, address indexed borrower);
    event LoanApproved(uint256 indexed id, address indexed lender, address indexed borrower);
    event LoanRejected(uint256 indexed id, address indexed lender, address indexed borrower);

    modifier offerExists(uint256 _id) {
        require(_id < offers.length, "Offer does not exist");
        _;
    }

    // Lender publishes a loan offer
    function createOffer(uint256 _amount) external {
        require(_amount > 0, "Amount must be greater than 0");

        uint256 id = offers.length;
        offers.push(LoanOffer(id, msg.sender, address(0), _amount, Status.Available));

        emit OfferCreated(id, msg.sender, _amount);
    }

    // Borrower requests an available offer
    function requestLoan(uint256 _id) external offerExists(_id) {
        LoanOffer storage offer = offers[_id];

        require(offer.status == Status.Available, "Offer is not available");
        require(offer.lender != msg.sender, "Lender cannot request own offer");

        offer.borrower = msg.sender;
        offer.status = Status.Requested;

        emit LoanRequested(_id, msg.sender);
    }

    // Lender approves the request
    function approveLoan(uint256 _id) external offerExists(_id) {
        LoanOffer storage offer = offers[_id];

        require(offer.lender == msg.sender, "Only the lender can approve");
        require(offer.status == Status.Requested, "No pending request");

        offer.status = Status.Approved;

        emit LoanApproved(_id, msg.sender, offer.borrower);
    }

    // Lender rejects the request
    function rejectLoan(uint256 _id) external offerExists(_id) {
        LoanOffer storage offer = offers[_id];

        require(offer.lender == msg.sender, "Only the lender can reject");
        require(offer.status == Status.Requested, "No pending request");

        offer.status = Status.Rejected;

        emit LoanRejected(_id, msg.sender, offer.borrower);
    }

    // ---------- Read functions ----------

    function getOffer(uint256 _id) external view offerExists(_id) returns (LoanOffer memory) {
        return offers[_id];
    }

    function getAllOffers() external view returns (LoanOffer[] memory) {
        return offers;
    }

    function getOfferCount() external view returns (uint256) {
        return offers.length;
    }
}