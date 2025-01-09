import * as readline from 'readline/promises';

/**
 * Singleton readline interface for the entire program
 */
export const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});
