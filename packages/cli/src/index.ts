#!/usr/bin/env node
import { Command } from 'commander';
import { ingestCommand } from './commands/ingest';
import { verifyCommand } from './commands/verify';
import { searchCommand } from './commands/search';

const program = new Command();

program
  .name('careequity')
  .description('CareEquity CLI for ingestion and moderation')
  .version('0.0.1');

ingestCommand(program);
verifyCommand(program);
searchCommand(program);

program.parse(process.argv);
