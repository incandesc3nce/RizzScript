import {
  ArrayLiteral,
  AssignmentExpression,
  BinaryExpression,
  CallExpression,
  Identifier,
  MemberExpression,
  ObjectLiteral,
} from '../../frontend/ast';
import Environment from '../environment';
import { evaluate } from '../interpreter';
import {
  NumberValue,
  RuntimeValue,
  MK_NULL,
  ObjectValue,
  MK_BOOL,
  BooleanValue,
  MK_NUMBER,
  StringValue,
  FunctionValue,
  NativeFnValue,
  NullValue,
  ArrayValue,
} from '../values';

/**
 * Evaulate pure numeric operations with binary operators.
 * @param lhs Left-hand side of the operation.
 * @param rhs Right-hand side of the operation.
 * @param operator Operator to be applied.
 * @returns The result of the operation.
 */
export function evaluateNumericBinaryExpression(
  lhs: RuntimeValue,
  rhs: RuntimeValue,
  operator: string,
): RuntimeValue {
  switch (operator) {
    case '|': {
      if (lhs.type !== 'boolean' || rhs.type !== 'boolean')
        return MK_BOOL(false);
      return MK_BOOL(
        (lhs as BooleanValue).value || (rhs as BooleanValue).value,
      );
    }
    case '&&':
      if (lhs.type !== 'boolean' || rhs.type !== 'boolean')
        return MK_BOOL(false);
      return MK_BOOL(
        (lhs as BooleanValue).value && (rhs as BooleanValue).value,
      );
    case '!=':
      return equals(lhs, rhs, false);
    case '==':
      return equals(lhs, rhs, true);
    default: {
      if (lhs.type !== 'number' || rhs.type !== 'number') return MK_BOOL(false);

      const llhs = lhs as NumberValue;
      const rrhs = rhs as NumberValue;

      switch (operator) {
        case '+':
          return MK_NUMBER(llhs.value + rrhs.value);
        case '-':
          return MK_NUMBER(llhs.value - rrhs.value);
        case '*':
          return MK_NUMBER(llhs.value * rrhs.value);
        case '/':
          return MK_NUMBER(llhs.value / rrhs.value);
        case '%':
          return MK_NUMBER(llhs.value % rrhs.value);
        case '<':
          return MK_BOOL(llhs.value < rrhs.value);
        case '>':
          return MK_BOOL(llhs.value > rrhs.value);
        default:
          throw `Unknown operator provided in operation: ${lhs}, ${rhs}.`;
      }
    }
  }
}

/**
 * Compares two runtime values for equality.
 * @param lhs Left-hand side of the comparison.
 * @param rhs Right-hand side of the comparison.
 * @param strict Whether the comparison should be strict or not.
 */
function equals(
  lhs: RuntimeValue,
  rhs: RuntimeValue,
  strict: boolean,
): RuntimeValue {
  const compare = strict
    ? (a: unknown, b: unknown) => a === b
    : (a: unknown, b: unknown) => a !== b;

  switch (lhs.type) {
    case 'boolean':
      return MK_BOOL(
        compare((lhs as BooleanValue).value, (rhs as BooleanValue).value),
      );
    case 'number':
      return MK_BOOL(
        compare((lhs as NumberValue).value, (rhs as NumberValue).value),
      );
    case 'string':
      return MK_BOOL(
        compare((lhs as StringValue).value, (rhs as StringValue).value),
      );
    case 'fn':
      return MK_BOOL(
        compare((lhs as FunctionValue).body, (rhs as FunctionValue).body),
      );
    case 'native-fn':
      return MK_BOOL(
        compare((lhs as NativeFnValue).call, (rhs as NativeFnValue).call),
      );
    case 'null':
      return MK_BOOL(
        compare((lhs as NullValue).value, (rhs as NullValue).value),
      );
    case 'object':
      return MK_BOOL(
        compare(
          (lhs as ObjectValue).properties,
          (rhs as ObjectValue).properties,
        ),
      );
    case 'array':
      return MK_BOOL(
        compare((lhs as ArrayValue).elements, (rhs as ArrayValue).elements),
      );
    default:
      throw `RunTime: Unhandled type in equals function: ${lhs.type}, ${rhs.type}`;
  }
}

/**
 * Evaulates expressions following the binary operation type.
 * @param binaryOperator Binary expression to be evaluated.
 * @param env Environment where the binary expression is defined.
 */
export function evaluateBinaryExpression(
  binaryOperator: BinaryExpression,
  env: Environment,
): RuntimeValue {
  const leftHandSide = evaluate(binaryOperator.left, env);
  const rightHandSide = evaluate(binaryOperator.right, env);

  return evaluateNumericBinaryExpression(
    leftHandSide,
    rightHandSide,
    binaryOperator.operator,
  );
}

/**
 * Evaluates an identifier by looking up its value in the environment.
 * @param ident Identifier to be evaluated.
 * @param env Environment where the identifier is defined.
 * @returns The value of the identifier.
 */
export function evaluateIdentifier(
  ident: Identifier,
  env: Environment,
): RuntimeValue {
  const val = env.lookupVariable(ident.symbol);

  return val;
}

/**
 * Evaluates an assignment expression and updates the environment with the new value.
 *
 * @param node - The assignment expression node to evaluate.
 * @param env - The environment in which to evaluate the expression.
 * @returns The runtime value resulting from the assignment.
 * @throws Will throw an error if the assignment target is not an identifier.
 */
export function evaluateAssignment(
  node: AssignmentExpression,
  env: Environment,
): RuntimeValue {
  if (node.assignee.kind === 'MemberExpression')
    return evaluateMemberExpression(env, node);
  if (node.assignee.kind !== 'Identifier')
    throw `💀 Invalid left-hand-side expression: ${JSON.stringify(node.assignee)}.`;

  const varname = (node.assignee as Identifier).symbol;

  return env.assignVariable(varname, evaluate(node.value, env));
}

/**
 * Evaluates an object literal and returns the object value.
 * @param obj Object literal to be evaluated.
 * @param env Environment where the object is defined.
 * @returns The object value.
 */
export function evaluateObjectExpression(
  obj: ObjectLiteral,
  env: Environment,
): RuntimeValue {
  const object = { type: 'object', properties: new Map() } as ObjectValue;

  for (const { key, value } of obj.properties) {
    const runtimeVal =
      value === undefined ? env.lookupVariable(key) : evaluate(value, env);

    object.properties.set(key, runtimeVal);
  }

  return object;
}

/**
 * Evaluates an array literal and returns the array value.
 * @param obj Array literal to be evaluated.
 * @param env Environment where the array is defined.
 * @returns The array value.
 */
export function evaluateArrayExpression(
  obj: ArrayLiteral,
  env: Environment,
): RuntimeValue {
  const array = { type: 'array', elements: [] } as ArrayValue;

  for (const value of obj.values) {
    const runtimeVal = evaluate(value, env);

    array.elements.push(runtimeVal);
  }

  return array;
}

/**
 * Evaluates a function declaration and returns the function value.
 * @param func Function declaration to be evaluated.
 * @param env Environment where the function is defined.
 * @returns The function value.
 */
export function evaluateFunction(
  func: FunctionValue,
  args: RuntimeValue[],
): RuntimeValue {
  const scope = new Environment(func.declarationEnv);

  // Create the variables for the parameters list
  for (let i = 0; i < func.params.length; i++) {
    // TODO check the bounds here
    // verify arity of function
    const varname = func.params[i];
    scope.declareVariable(varname, args[i], false);
  }

  let result: RuntimeValue = MK_NULL();

  // Evaluate the function body line by line
  for (const stmt of func.body) {
    result = evaluate(stmt, scope);
  }

  return result;
}

/**
 * Evaluates a call expression and returns the result of the call.
 * @param expr Call expression to be evaluated.
 * @param env Environment where the call is defined.
 * @returns The result of the call.
 */
export function evalCallExpression(
  expr: CallExpression,
  env: Environment,
): RuntimeValue {
  const args = expr.args.map((arg) => evaluate(arg, env));
  const fn = evaluate(expr.callee, env);

  if (fn != null) {
    if (fn.type == 'native-fn') {
      return (fn as NativeFnValue).call(args, env);
    }

    if (fn.type == 'fn') {
      const func = fn as FunctionValue;
      return evaluateFunction(func, args);
    }
  }

  throw '💀 Cannot call value that is not a function: ' + JSON.stringify(fn);
}

/**
 * Evaluates a member expression and returns the result of the member.
 * @param env Environment where the member is defined.
 * @param node Assignment expression node to evaluate.
 * @param expr Member expression to evaluate.
 * @returns The runtime value resulting from the member expression.
 * @throws Will throw an error if the member expression is not provided.
 */
export function evaluateMemberExpression(
  env: Environment,
  node?: AssignmentExpression,
  expr?: MemberExpression,
): RuntimeValue {
  if (expr) return env.lookupOrMutObject(expr);
  if (node)
    return env.lookupOrMutObject(
      node.assignee as MemberExpression,
      evaluate(node.value, env),
    );

  throw `💀 Evaluating a member expression is not possible without a member or assignment expression.`;
}
