const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

// Matches the Status enum order in the contract
const Status = { Available: 0, Requested: 1, Approved: 2, Rejected: 3 };

describe("LendingPlatform", function () {
  async function deployFixture() {
    const [lender, borrower, other] = await ethers.getSigners();
    const platform = await ethers.deployContract("LendingPlatform");
    await platform.waitForDeployment();
    return { platform, lender, borrower, other };
  }

  describe("createOffer", function () {
    it("creates an offer with correct details and emits an event", async function () {
      const { platform, lender } = await loadFixture(deployFixture);

      await expect(platform.connect(lender).createOffer(100))
        .to.emit(platform, "OfferCreated")
        .withArgs(0, lender.address, 100);

      const offer = await platform.getOffer(0);
      expect(offer.id).to.equal(0);
      expect(offer.lender).to.equal(lender.address);
      expect(offer.borrower).to.equal(ethers.ZeroAddress);
      expect(offer.amount).to.equal(100);
      expect(offer.status).to.equal(Status.Available);
    });

    it("rejects a zero amount", async function () {
      const { platform, lender } = await loadFixture(deployFixture);
      await expect(platform.connect(lender).createOffer(0)).to.be.revertedWith(
        "Amount must be greater than 0"
      );
    });

    it("gives each offer a unique ID", async function () {
      const { platform, lender } = await loadFixture(deployFixture);
      await platform.connect(lender).createOffer(100);
      await platform.connect(lender).createOffer(200);

      expect(await platform.getOfferCount()).to.equal(2);
      const all = await platform.getAllOffers();
      expect(all[0].id).to.equal(0);
      expect(all[1].id).to.equal(1);
    });
  });

  describe("requestLoan", function () {
    it("lets a borrower request an available offer", async function () {
      const { platform, lender, borrower } = await loadFixture(deployFixture);
      await platform.connect(lender).createOffer(100);

      await expect(platform.connect(borrower).requestLoan(0))
        .to.emit(platform, "LoanRequested")
        .withArgs(0, borrower.address);

      const offer = await platform.getOffer(0);
      expect(offer.borrower).to.equal(borrower.address);
      expect(offer.status).to.equal(Status.Requested);
    });

    it("blocks the lender from requesting their own offer", async function () {
      const { platform, lender } = await loadFixture(deployFixture);
      await platform.connect(lender).createOffer(100);
      await expect(platform.connect(lender).requestLoan(0)).to.be.revertedWith(
        "Lender cannot request own offer"
      );
    });

    it("blocks a second request on the same offer", async function () {
      const { platform, lender, borrower, other } = await loadFixture(deployFixture);
      await platform.connect(lender).createOffer(100);
      await platform.connect(borrower).requestLoan(0);
      await expect(platform.connect(other).requestLoan(0)).to.be.revertedWith(
        "Offer is not available"
      );
    });

    it("fails for a non-existent offer", async function () {
      const { platform, borrower } = await loadFixture(deployFixture);
      await expect(platform.connect(borrower).requestLoan(99)).to.be.revertedWith(
        "Offer does not exist"
      );
    });
  });

  describe("approveLoan / rejectLoan", function () {
    async function requestedFixture() {
      const base = await deployFixture();
      await base.platform.connect(base.lender).createOffer(100);
      await base.platform.connect(base.borrower).requestLoan(0);
      return base;
    }

    it("lets the lender approve a request", async function () {
      const { platform, lender, borrower } = await loadFixture(requestedFixture);

      await expect(platform.connect(lender).approveLoan(0))
        .to.emit(platform, "LoanApproved")
        .withArgs(0, lender.address, borrower.address);

      expect((await platform.getOffer(0)).status).to.equal(Status.Approved);
    });

    it("lets the lender reject a request", async function () {
      const { platform, lender, borrower } = await loadFixture(requestedFixture);

      await expect(platform.connect(lender).rejectLoan(0))
        .to.emit(platform, "LoanRejected")
        .withArgs(0, lender.address, borrower.address);

      expect((await platform.getOffer(0)).status).to.equal(Status.Rejected);
    });

    it("only allows the lender to approve or reject", async function () {
      const { platform, borrower } = await loadFixture(requestedFixture);
      await expect(platform.connect(borrower).approveLoan(0)).to.be.revertedWith(
        "Only the lender can approve"
      );
      await expect(platform.connect(borrower).rejectLoan(0)).to.be.revertedWith(
        "Only the lender can reject"
      );
    });

    it("fails when there is no pending request", async function () {
      const { platform, lender } = await loadFixture(deployFixture);
      await platform.connect(lender).createOffer(100);
      await expect(platform.connect(lender).approveLoan(0)).to.be.revertedWith(
        "No pending request"
      );
    });

    it("cannot be approved twice", async function () {
      const { platform, lender } = await loadFixture(requestedFixture);
      await platform.connect(lender).approveLoan(0);
      await expect(platform.connect(lender).approveLoan(0)).to.be.revertedWith(
        "No pending request"
      );
    });
  });
});