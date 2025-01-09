export type NodeType =
  // Statements
  | 'Program'
  | 'VariableDeclaration'
  | 'FunctionDeclaration'
  | 'IfStatement'
  | 'ForStatement'
  | 'TryCatchStatement'

  // Expressions
  | 'AssignmentExpression'
  | 'MemberExpression'
  | 'CallExpression'

  // Literals
  | 'Property'
  | 'ObjectLiteral'
  | 'ArrayLiteral'
  | 'NumericLiteral'
  | 'StringLiteral'
  | 'Identifier'
  | 'BinaryExpression';

/**
 * Statements do not result in a value at runtime.
 * They are used to define the structure of the program.
 */
export interface Statement {
  kind: NodeType;
}

/**
 * Defines a block which contains many statements.
 * -  Only one program will be contained in a file.
 */
export interface Program extends Statement {
  kind: 'Program';
  body: Statement[];
}

/**
 * Represents a variable declaration in the source code.
 * - Can be a constant or a variable.
 * - Identifier is the name of the variable.
 * - Can have undefined value.
 */
export interface VariableDeclaration extends Statement {
  kind: 'VariableDeclaration';
  constant: boolean;
  identifier: string;
  value?: Expression;
}

/**
 * Represents an if statement in the source code.
 */
export interface IfStatement extends Statement {
  kind: 'IfStatement';
  test: Expression;
  body: Statement[];
  alternate?: Statement[];
}

/**
 * Represents a try-catch block in the source code.
 */
export interface TryCatchStatement extends Statement {
  kind: 'TryCatchStatement';
  body: Statement[];
  alternate: Statement[];
}

/**
 * Represents a function declaration in the source code.
 */
export interface FunctionDeclaration extends Statement {
  kind: 'FunctionDeclaration';
  params: string[];
  name: string;
  body: Statement[];
}

/**
 * Represents a for loop in the source code.
 */
export interface ForStatement extends Statement {
  kind: 'ForStatement';
  init: VariableDeclaration;
  test: Expression;
  update: AssignmentExpression;
  body: Statement[];
}

/**
 * Expressions will result in a value at runtime unlike Statements.
 */
export interface Expression extends Statement {}

/**
 * Represents a function declaration in the source code.
 */
export interface AssignmentExpression extends Statement {
  kind: 'AssignmentExpression';
  assignee: Expression;
  value: Expression;
}

/**
 * A operation with two sides separated by a operator.
 * Both sides can be ANY Complex Expression.
 * - Supported Operators -> + | - | / | * | %
 */
export interface BinaryExpression extends Expression {
  kind: 'BinaryExpression';
  left: Expression;
  right: Expression;
  operator: string;
}

/**
 * Represents a function call in the source code.
 */
export interface CallExpression extends Expression {
  kind: 'CallExpression';
  args: Expression[];
  callee: Expression;
}

/**
 * Represents a member expression in the source code.
 */
export interface MemberExpression extends Expression {
  kind: 'MemberExpression';
  object: Expression;
  property: Expression;
  computed: boolean;
}

/**
 * Represents a user-defined variable or symbol in source.
 */
export interface Identifier extends Expression {
  kind: 'Identifier';
  symbol: string;
}

/**
 * Represents a numeric constant inside the source code.
 */
export interface NumericLiteral extends Expression {
  kind: 'NumericLiteral';
  value: number;
}

/**
 * Represents a string constant inside the source code.
 */
export interface StringLiteral extends Expression {
  kind: "StringLiteral";
  value: string;
}

/**
 * Represents an array literal in the source code.
 */
export interface ArrayLiteral extends Expression {
  kind: "ArrayLiteral";
  values: Array<Expression>;
}

/**
 * Represents a property inside an object.
 */
export interface Property extends Expression {
  kind: 'Property';
  key: string;
  value?: Expression;
}

/**
 * Represents an object literal in the source code.
 */
export interface ObjectLiteral extends Expression {
  kind: 'ObjectLiteral';
  properties: Property[];
}
