const hre = require("hardhat");

async function main() {
    const kycAddress = process.env.VITE_KYC_CONTRACT_ADDRESS;
    console.log("Querying KYCRegistry at:", kycAddress);

    if (!kycAddress) {
        console.error("VITE_KYC_CONTRACT_ADDRESS not found in environment variables.");
        return;
    }

    const KYCRegistry = await hre.ethers.getContractFactory("KYCRegistry");
    const kyc = KYCRegistry.attach(kycAddress);

    try {
        const total = await kyc.totalUsers();
        console.log("Total Users in Registry:", total.toString());
    } catch (e) {
        console.error("Error fetching totalUsers:", e.message);
        return;
    }

    // Filter for KYCSubmitted events
    const filter = kyc.filters.KYCSubmitted();

    // Query last 100 blocks to avoid RPC timeout
    const currentBlock = await hre.ethers.provider.getBlockNumber();
    const fromBlock = Math.max(0, currentBlock - 100);
    console.log(`Querying events from block ${fromBlock} to ${currentBlock}...`);

    try {
        const events = await kyc.queryFilter(filter, fromBlock, currentBlock);
        console.log(`Found ${events.length} KYCSubmitted events.`);

        for (const event of events) {
            const { user, name, email, timestamp } = event.args;
            console.log(`- User: ${user}, Name: ${name}, Email: ${email}, Time: ${new Date(Number(timestamp) * 1000).toISOString()}`);

            // Check current profile
            try {
                const profile = await kyc.getUserProfile(user);
                console.log(`  Current Status: ${profile.kycStatus} (0=NotStarted, 1=Pending, 2=Verified, 3=Rejected)`);
                console.log(`  Exists: ${profile.exists}`);
            } catch (e) {
                console.log("  Error fetching profile:", e.message);
            }
        }
    } catch (e) {
        console.error("Error querying events:", e.message);
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
