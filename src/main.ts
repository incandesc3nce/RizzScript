import { readFileSync } from 'fs';
import Parser from './frontend/parser';
import { createGlobalEnvironment } from './runtime/environment';
import { evaluate } from './runtime/interpreter';
import { runtimeToJS } from './runtime/eval/native-fns';
import { transcribe } from './utils/transcriber';
import { rl } from './utils/readlineInterface';

const args = process.argv;
args.shift();
args.shift();
const file = args.shift();
if (file) {
  run(file);
} else {
  repl();
}

/**
 * Function used for reading a .rizz file and executing it.
 * @param filename The name of the file to read and execute.
 */
async function run(filename: string): Promise<void> {
  // Import fs module dynamically
  let input = readFileSync(filename, 'utf-8') + '\nfinishExit()';

  const parser = new Parser();
  const env = createGlobalEnvironment();

  
  input = transcribe(input);
  console.log(input);
  
  const program = parser.produceAST(input);

  evaluate(program, env);
}

/**
 * Function that starts the REPL (Read-Eval-Print-Loop) for the RizzScript language.
 */
async function repl(): Promise<never> {
  const parser = new Parser();
  const env = createGlobalEnvironment();


  console.log('\n🔥 RizzScript v1.0');

  // Continue REPL until user stops or types 'exit'
  while (true) {
    let input = await rl.question('> ');
    input = transcribe(input);

    if (input === 'exit') {
      process.exit(0);
    }
    
    const program = parser.produceAST(input);

    try {
      const result = runtimeToJS(evaluate(program, env));
      console.log(result);
    } catch (error) {
      console.error(error);
    }
  }
}
