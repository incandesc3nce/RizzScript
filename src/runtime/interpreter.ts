import { NumberValue, RuntimeValue, StringValue } from './values';
import {
  ArrayLiteral,
  AssignmentExpression,
  BinaryExpression,
  CallExpression,
  ForStatement,
  FunctionDeclaration,
  Identifier,
  IfStatement,
  MemberExpression,
  NumericLiteral,
  ObjectLiteral,
  Program,
  Statement,
  StringLiteral,
  TryCatchStatement,
  VariableDeclaration,
} from '../frontend/ast';
import Environment from './environment';
import {
  evaluateIdentifier,
  evaluateBinaryExpression,
  evaluateAssignment,
  evaluateObjectExpression,
  evaluateArrayExpression,
  evalCallExpression,
  evaluateMemberExpression,
} from './eval/expressions';
import {
  evalForStatement,
  evalFunctionDeclaration,
  evalIfStatement,
  evalTryCatchStatement,
  evaluateProgram,
  evaluateVariableDeclaration,
} from './eval/statements';

/**
 * Evaluates an AST node and returns the result.
 * @param astNode AST node to be evaluated.
 * @param env Environment where the node is defined.
 * @returns The result of the evaluation.
 */
export function evaluate(astNode: Statement, env: Environment): RuntimeValue {
  switch (astNode.kind) {
    case 'Program':
      return evaluateProgram(astNode as Program, env);

    case 'NumericLiteral':
      return {
        value: (astNode as NumericLiteral).value,
        type: 'number',
      } as NumberValue;

    case 'StringLiteral':
      return {
        value: (astNode as StringLiteral).value,
        type: 'string',
      } as StringValue;

    case 'Identifier':
      return evaluateIdentifier(astNode as Identifier, env);

    case 'ObjectLiteral':
      return evaluateObjectExpression(astNode as ObjectLiteral, env);

    case 'ArrayLiteral':
      return evaluateArrayExpression(astNode as ArrayLiteral, env);

    case 'CallExpression':
      return evalCallExpression(astNode as CallExpression, env);

    case 'AssignmentExpression':
      return evaluateAssignment(astNode as AssignmentExpression, env);

    case 'BinaryExpression':
      return evaluateBinaryExpression(astNode as BinaryExpression, env);

    case 'IfStatement':
      return evalIfStatement(astNode as IfStatement, env);

    case 'ForStatement':
      return evalForStatement(astNode as ForStatement, env);

    case 'MemberExpression':
      return evaluateMemberExpression(
        env,
        undefined,
        astNode as MemberExpression,
      );

    case 'TryCatchStatement':
      return evalTryCatchStatement(env, astNode as TryCatchStatement);

    case 'VariableDeclaration':
      return evaluateVariableDeclaration(astNode as VariableDeclaration, env);

    case 'FunctionDeclaration':
      return evalFunctionDeclaration(astNode as FunctionDeclaration, env);

    default:
      console.error('💀 Unknown expression:', astNode);
      process.exit(0);
  }
}
