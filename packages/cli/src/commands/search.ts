import { Command } from 'commander';
import { esClient, INDEX_NAME, providerMapping } from '@careequity/core';

export function searchCommand(program: Command) {
  const search = program.command('search').description('Search related commands');

  search
    .command('init')
    .description('Initialize Elasticsearch index')
    .action(async () => {
      try {
        const exists = await esClient.indices.exists({ index: INDEX_NAME });
        if (exists) {
          console.log(`Index ${INDEX_NAME} already exists. Deleting...`);
          await esClient.indices.delete({ index: INDEX_NAME });
        }

        await esClient.indices.create({
          index: INDEX_NAME,
          mappings: providerMapping,
        });
        console.log(`Index ${INDEX_NAME} created successfully.`);
      } catch (error) {
        console.error('Failed to initialize index:', error);
      }
      process.exit(0);
    });
}
