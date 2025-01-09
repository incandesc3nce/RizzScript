import { ForStatement, FunctionDeclaration, IfStatement, Program, Statement, TryCatchStatement, VariableDeclaration } from '../../frontend/ast';
import Environment from '../environment';
import { evaluate } from '../interpreter';
import { BooleanValue, FunctionValue, MK_NULL, RuntimeValue } from '../values';
import { evaluateAssignment } from './expressions';

/**
 * Evaluate a program by iterating over its body.
 * @param program Program to be evaluated.
 * @returns The last evaluated statement.
 */
export function evaluateProgram(
  program: Program,
  env: Environment,
): RuntimeValue {
  let lastEvaluated: RuntimeValue = MK_NULL();

  for (const statement of program.body) {
    lastEvaluated = evaluate(statement, env);
  }

  return lastEvaluated;
}

/**
 * Evaluate a variable declaration by declaring the variable in the environment.
 * @param declaration Variable declaration to be evaluated.
 * @param env Environment where the declaration is defined.
 * @returns The value of the variable.
 */
export function evaluateVariableDeclaration(
  declaration: VariableDeclaration,
  env: Environment,
): RuntimeValue {
  const value = declaration.value
    ? evaluate(declaration.value, env)
    : MK_NULL();

  return env.declareVariable(declaration.identifier, value, declaration.constant);
}

/**
 * Evaluate a function declaration by declaring the function in the environment.
 * @param declaration Function declaration to be evaluated.
 * @param env Environment where the declaration is defined.
 * @returns The function value.
 */
export function evalFunctionDeclaration(declaration: FunctionDeclaration, env: Environment): RuntimeValue {
  // Create new function scope
  const fn = {
      type: "fn",
      name: declaration.name,
      params: declaration.params,
      declarationEnv: env,
      body: declaration.body,
  } as FunctionValue;

  return declaration.name == "<anonymous>" ? fn : env.declareVariable(declaration.name, fn, true);
}

/**
 * Evaluate an if statement by evaluating the test and executing
 * the body or alternate depending on the result.
 * @param declaration If statement to be evaluated.
 * @param env Environment where the statement is defined.
 * @returns The result of the executed body or alternate.
 */
export function evalIfStatement(declaration: IfStatement, env: Environment): RuntimeValue {
  const test = evaluate(declaration.test, env);

  if ((test as BooleanValue).value === true) {
      return evalBody(declaration.body, env);
  } else if (declaration.alternate) {
      return evalBody(declaration.alternate, env);
  } else {
      return MK_NULL();
  }
}

/**
 * Evaluate a block of statements by evaluating each statement in the block.
 * @param body Block of statements to be evaluated.
 * @param env Environment where the statements are defined.
 * @param newEnv Whether to create a new environment for the block.
 * @returns The result of the last evaluated statement.
 */
function evalBody(body: Statement[], env: Environment, newEnv: boolean = true): RuntimeValue {
  let scope: Environment;

  if (newEnv) {
      scope = new Environment(env);
  } else {
      scope = env;
  }
  let result: RuntimeValue = MK_NULL();

  // Evaluate the if body line by line
  for (const stmt of body) {
      // if((stmt as Identifier).symbol === 'continue') return result;
      result = evaluate(stmt, scope);
  }

  return result;
}

/**
 * Evaluate a for statement by evaluating the init, test, and update expressions
 * and executing the body until the test expression is false.
 * @param declaration For statement to be evaluated.
 * @param env Environment where the statement is defined.
 */
export function evalForStatement(declaration: ForStatement, env: Environment): RuntimeValue {
  env = new Environment(env);

  evaluateVariableDeclaration(declaration.init, env);

  const body = declaration.body;
  const update = declaration.update;

  let test = evaluate(declaration.test, env);

  if ((test as BooleanValue).value !== true) return MK_NULL(); // The loop didn't start

  do {
      evalBody(body, new Environment(env), false);
      evaluateAssignment(update, env);

      test = evaluate(declaration.test, env);
  } while ((test as BooleanValue).value);

  return MK_NULL();
}

/**
 * Evaluate a try-catch statement by evaluating the body and alternate statements
 * and catching any errors that occur.
 * @param env Environment where the statement is defined.
 * @param declaration Try-catch statement to be evaluated.
 * @returns The result of the executed body or alternate.
 */
export function evalTryCatchStatement(env: Environment, declaration?: TryCatchStatement): RuntimeValue {
  const try_env = new Environment(env);
  const catch_env = new Environment(env);

  try {
      return evalBody(declaration!.body, try_env, false);
  } catch (e) {
      env.assignVariable('error', e as RuntimeValue)
      return evalBody(declaration!.alternate, catch_env, false);
  }
}