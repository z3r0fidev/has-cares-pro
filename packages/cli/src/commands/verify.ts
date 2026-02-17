import { Command } from 'commander';
import { AppDataSource, Provider, VerificationRecord, VerificationStatus } from '@careequity/db';

export function verifyCommand(program: Command) {
  program
    .command('verify')
    .description('Verify provider identity')
    .requiredOption('-p, --provider-id <id>', 'Provider ID')
    .requiredOption('-t, --tier <tier>', 'Verification Tier (1, 2, 3)')
    .requiredOption('-s, --status <status>', 'Status (approved, rejected)')
    .option('-n, --notes <notes>', 'Review notes')
    .action(async (options) => {
      if (!AppDataSource.isInitialized) {
        await AppDataSource.initialize();
      }
      const providerRepo = AppDataSource.getRepository(Provider);
      const recordRepo = AppDataSource.getRepository(VerificationRecord);

      const provider = await providerRepo.findOneBy({ id: options.providerId });
      if (!provider) {
        console.error('Provider not found');
        process.exit(1);
      }

      const record = new VerificationRecord();
      record.provider = provider;
      record.tier = parseInt(options.tier);
      record.status = options.status as VerificationStatus;
      record.notes = options.notes;
      record.reviewer_id = 'cli-admin';

      await recordRepo.save(record);

      if (options.status === 'approved') {
        provider.verification_tier = parseInt(options.tier);
        await providerRepo.save(provider);
      }

      console.log(`Verification updated for ${provider.name} to Tier ${options.tier}`);
      process.exit(0);
    });
}
