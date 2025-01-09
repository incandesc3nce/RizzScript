import {
  Statement,
  Program,
  Expression,
  BinaryExpression,
  NumericLiteral,
  Identifier,
  VariableDeclaration,
  AssignmentExpression,
  Property,
  ObjectLiteral,
  CallExpression,
  MemberExpression,
  ForStatement,
  IfStatement,
  FunctionDeclaration,
  TryCatchStatement,
  ArrayLiteral,
  StringLiteral,
} from './ast';
import { tokenize, Token, TokenType } from './lexer';

/**
 * Frontend for producing a valid AST from source code
 */
export default class Parser {
  private tokens: Token[] = [];

  private lineCounter: number = 1;
  private column: number = 0;
  private nonNLLine: number = 0;
  private nonNLColumn: number = 0;
  private lastNonNLLine: number = 0;
  private lastNonNLColumn: number = 0;

  /**
   * Shifts the tokens array and returns the shifted token.
   * @returns Shifted token.
   */
  private shift(): Token {
    const token = this.tokens.shift()!;
    switch (token.type) {
      case TokenType.NewLine:
        this.lineCounter++;
        break;
      case TokenType.String: {
        const split = token.raw.split('\n');
        this.lineCounter += split.length - 1;
        if (split.length > 1) {
          this.column = split[split.length - 1].length + 1; // +1 for quote
        }
      }
      default:
        this.lastNonNLLine = this.nonNLLine;
        this.nonNLLine = this.lineCounter;
        if (
          token.type != TokenType.String &&
          (token.type != TokenType.Identifier || token.value != 'finishExit')
        ) {
          this.lastNonNLLine = this.nonNLLine;
          this.nonNLLine = this.lineCounter;
          this.column += token.value.length;
          this.lastNonNLColumn = this.nonNLColumn;
          this.nonNLColumn = this.column;
        }
        this.lastNonNLColumn = this.nonNLColumn;
        this.nonNLColumn = this.column;
        break;
    }
    return token;
  }

  /**
   * Returns current token.
   */
  private at(): Token {
    let token = this.tokens[0] as Token;
    while (token.type == TokenType.NewLine) {
      this.shift();
      token = this.tokens[0] as Token;
    }
    return token;
  }

  /**
   * Determines if the parsing is complete and the END OF FILE is reached.
   */
  private notEOF(): boolean {
    return this.at().type !== TokenType.EOF;
  }

  /**
   * Returns the previous token and advances the tokens array to the next value.
   */
  private eat() {
    let prev;
    do {
      prev = this.shift();
    } while (prev.type == TokenType.NewLine);

    return prev;
  }

  /**
   * Checks if the previous token is of the expected type and throws if types don't match.
   * @param type Expected token type.
   * @param error Error message to be thrown if types don't match.
   * @returns Previous token.
   */
  private expect(type: TokenType, err: string) {
    const prev = this.eat();

    if (!prev || prev.type != type) {
      console.error(
        `🗣️ Parser error: (Ln ${this.lastNonNLLine}, Col ${this.lastNonNLColumn + 1})\n`,
        err,
        'Expecting:',
        type,
      );
      process.exit(1);
    }

    return prev;
  }

  /**
   * Handles complex statement types
   */
  private parseStatement(): Statement {
    switch (this.at().type) {
      case TokenType.Let:
      case TokenType.Const:
        return this.parseVariableDeclaration();
      case TokenType.Fn:
        return this.parseFunctionDeclaration();
      case TokenType.If:
        return this.parseIfStatement();
      case TokenType.For:
        return this.parseForStatement();
      case TokenType.NewLine:
        this.at(); // will remove all new lines
        return this.parseStatement();
      default:
        return this.parseExpression();
    }
  }

  /**
   * Handles block statements and code blocks
   */
  private parseBlockStatement(): Statement[] {
    this.expect(
      TokenType.OpenBrace,
      '💀 Opening brace ("{") expected while parsing code block.',
    );

    const body: Statement[] = [];

    while (this.notEOF() && this.at().type !== TokenType.CloseBrace) {
      const stmt = this.parseStatement();
      body.push(stmt);
    }

    this.expect(
      TokenType.CloseBrace,
      '💀 Closing brace ("}") expected while parsing code block.',
    );

    return body;
  }

  /**
   * Handles for loop statements
   */
  private parseForStatement(): Statement {
    this.eat(); // eat "for" keyword
    this.expect(
      TokenType.OpenParen,
      '💀 Opening parenthesis ("(") expected following "for" statement.',
    );
    const init = this.parseVariableDeclaration();
    const test = this.parseExpression();

    this.expect(
      TokenType.Semicolon,
      '💀 Semicolon (";") expected following "test expression" in "for" statement.',
    );

    const update = this.parseExpression();

    this.expect(
      TokenType.CloseParen,
      '💀 Closing parenthesis (")") expected following "additive expression" in "for" statement.',
    );

    const body = this.parseBlockStatement();

    return {
      kind: 'ForStatement',
      init,
      test,
      update,
      body,
    } as ForStatement;
  }

  /**
   * Handles if statements
   */
  private parseIfStatement(): Statement {
    this.eat(); // eat if keyword
    this.expect(
      TokenType.OpenParen,
      '💀 Opening parenthesis ("(") expected following "if" statement.',
    );

    const test = this.parseExpression();

    this.expect(
      TokenType.CloseParen,
      '💀 Closing parenthesis (")") expected following "if" statement.',
    );

    const body = this.parseBlockStatement();

    let alternate: Statement[] = [];

    if (this.at().type == TokenType.Else) {
      this.eat(); // eat "else"

      if (this.at().type == TokenType.If) {
        alternate = [this.parseIfStatement()];
      } else {
        alternate = this.parseBlockStatement();
      }
    }

    return {
      kind: 'IfStatement',
      body: body,
      test,
      alternate,
    } as IfStatement;
  }

  /**
   * Handles function declarations
   */
  private parseFunctionDeclaration(): Statement {
    this.eat(); // eat fn keyword
    const name =
      this.at().type == TokenType.Identifier ? this.eat().value : '<anonymous>';

    const args = this.parseArguments();
    const params: string[] = [];

    for (const arg of args) {
      if (arg.kind !== 'Identifier') {
        throw '💀 Arguments for function statement must be of type "String".';
      }

      params.push((arg as Identifier).symbol);
    }

    const body = this.parseBlockStatement();

    const fn = {
      body,
      name,
      params,
      kind: 'FunctionDeclaration',
    } as FunctionDeclaration;

    return fn;
  }

  /**
   * Handles variable declarations
   */
  private parseVariableDeclaration(): Statement {
    const isConst = this.eat().type === TokenType.Const;
    const identifier = this.expect(
      TokenType.Identifier,
      '💀 Expected an identifier after variable declaration.',
    ).value;

    if (this.at().type === TokenType.Semicolon) {
      this.eat(); // expect semicolon
      if (isConst) {
        throw '💀 No value provided for constant expression at declaration.';
      }

      return {
        kind: 'VariableDeclaration',
        identifier,
        constant: false,
      } as VariableDeclaration;
    }

    this.expect(
      TokenType.Equals,
      '💀 Expected an equals sign in variable declaration.',
    );

    const declaration = {
      kind: 'VariableDeclaration',
      identifier,
      value: this.parseExpression(),
      constant: isConst,
    } as VariableDeclaration;

    this.expect(
      TokenType.Semicolon,
      '💀 Expected a semicolon after variable declaration.',
    );

    return declaration;
  }

  /**
   * Handles expressions
   */
  private parseExpression(): Expression {
    const data = this.parseAssignmentExpression();

    if (this.at().type === TokenType.Ternary) {
      if (data.kind != 'BinaryExpression' && data.kind != 'Identifier') {
        throw new Error(
          '💀 Expected BinaryExpression or Identifier following ternary expression.',
        );
      }
      this.eat();

      const expr = this.parseExpression();

      if (
        expr.kind != 'BinaryExpression' ||
        (expr as BinaryExpression).operator != '|'
      ) {
        throw new Error(
          '💀 Bar ("|") expected following left side of ternary operator ("->").',
        );
      }

      const ifStmt = {
        kind: 'IfStatement',
        test: data,
        body: [(expr as BinaryExpression).left],
        alternate: [(expr as BinaryExpression).right],
      } as IfStatement;
      return {
        kind: 'CallExpression',
        args: [],
        callee: {
          kind: 'FunctionDeclaration',
          params: [],
          name: '<anonymous>',
          body: [ifStmt],
        } as FunctionDeclaration,
      } as CallExpression;
    }

    return data;
  }

  /**
   * Handles assignment operations
   */
  private parseAssignmentExpression(): Expression {
    const left = this.parseObjectExpression();

    if (this.at().type === TokenType.Equals) {
      this.eat();
      const value = this.parseAssignmentExpression();
      return {
        kind: 'AssignmentExpression',
        assignee: left,
        value,
      } as AssignmentExpression;
    }

    return left;
  }

  /**
   * Handles logical AND operations
   */
  private parseAndStatement(): Expression {
    let left = this.parseAdditiveExpression();

    if (['&&', '|'].includes(this.at().value)) {
      const operator = this.eat().value;
      const right = this.parseAdditiveExpression();

      left = {
        kind: 'BinaryExpression',
        left,
        right,
        operator,
      } as BinaryExpression;

      while (
        this.at().type == TokenType.And ||
        this.at().type == TokenType.Bar
      ) {
        left = {
          kind: 'BinaryExpression',
          left,
          operator: this.eat().value,
          right: this.parseExpression(),
        } as BinaryExpression;
      }
    }

    return left;
  }

  /**
   * Handles try-catch expressions
   */
  private parseTryCatchExpression(): Expression {
    if (this.at().type != TokenType.Identifier || this.at().value !== 'try') {
      return this.parseAndStatement();
    }

    this.eat();

    const body = this.parseBlockStatement();

    if (this.at().type != TokenType.Identifier || this.at().value !== 'catch')
      throw '💀 "try" statement must be followed by a "catch" statement.';

    this.eat();

    const alternate = this.parseBlockStatement();

    return {
      kind: 'TryCatchStatement',
      body,
      alternate,
    } as TryCatchStatement;
  }

  /**
   * Handles object expressions
   */
  private parseObjectExpression(): Expression {
    if (this.at().type !== TokenType.OpenBrace) {
      return this.parseArrayExpression();
    }

    this.eat();
    const properties = new Array<Property>();

    while (this.notEOF() && this.at().type !== TokenType.CloseBrace) {
      if (
        this.at().type != TokenType.Identifier &&
        this.at().type != TokenType.String
      ) {
        throw new Error(
          '💀 Identifier expected following "Object" expression.',
        );
      }
      const key = this.eat().value;

      // Allows shorthand key: pair -> { key, }
      if (this.at().type === TokenType.Comma) {
        this.eat();
        properties.push({ kind: 'Property', key } as Property);
        continue;
      } else if (this.at().type === TokenType.CloseBrace) {
        properties.push({ kind: 'Property', key } as Property);
        break;
      }

      // { key: value }
      this.expect(TokenType.Colon, '💀 Expected colon in object expression.');
      const value = this.parseExpression();

      properties.push({ kind: 'Property', key, value } as Property);
      if (this.at().type !== TokenType.CloseBrace) {
        this.expect(
          TokenType.Comma,
          '💀 Expected comma after object property.',
        );
      }
    }

    this.expect(
      TokenType.CloseBrace,
      '💀 Expected closing brace for object literal.',
    );
    return { kind: 'ObjectLiteral', properties } as ObjectLiteral;
  }

  /**
   * Handles Addition and Subtraction operations
   */
  private parseAdditiveExpression(): Expression {
    let left = this.parseMultiplicativeExpression();

    while (['+', '-', '==', '!=', '<', '>'].includes(this.at().value)) {
      const operator = this.eat().value;
      const right = this.parseMultiplicativeExpression();
      left = {
        kind: 'BinaryExpression',
        left,
        right,
        operator,
      } as BinaryExpression;
    }

    return left;
  }

  /**
   * Handles Array Expressions
   */
  private parseArrayExpression(): Expression {
    if (this.at().type !== TokenType.OpenBracket) {
      return this.parseTryCatchExpression();
    }

    this.eat(); // advance past [

    const values = new Array<Expression>();

    while (this.notEOF() && this.at().type != TokenType.CloseBracket) {
      values.push(this.parseExpression());

      if (this.at().type != TokenType.CloseBracket) {
        this.expect(
          TokenType.Comma,
          '💀 Comma (",") or closing bracket ("]") expected after "value" in array.',
        );
      }
    }

    this.expect(
      TokenType.CloseBracket,
      '💀 Closing Bracket ("]") expected at the end of "Array" expression.',
    );
    return { kind: 'ArrayLiteral', values } as ArrayLiteral;
  }

  /**
   * Handles Multiplication, Division and Modulus operations
   */
  private parseMultiplicativeExpression(): Expression {
    let left = this.parseCallMemberExpression();

    while (['/', '*', '%'].includes(this.at().value)) {
      const operator = this.eat().value;
      const right = this.parseCallMemberExpression();
      left = {
        kind: 'BinaryExpression',
        left,
        right,
        operator,
      } as BinaryExpression;
    }

    return left;
  }

  private parseCallMemberExpression(): Expression {
    const member = this.parseMemberExpression();

    if (this.at().type === TokenType.OpenParen) {
      return this.parseCallExpression(member);
    }

    return member;
  }

  /**
   * Handles Function Calls
   */
  private parseCallExpression(caller: Expression): Expression {
    let callExpr: Expression = {
      kind: 'CallExpression',
      callee: caller,
      args: this.parseArguments(),
    } as CallExpression;

    if (this.at().type === TokenType.OpenParen) {
      callExpr = this.parseCallExpression(callExpr);
    }

    return callExpr;
  }

  /**
   * Handles Function Arguments
   */
  private parseArguments(): Expression[] {
    this.expect(
      TokenType.OpenParen,
      '💀 Expected opening parenthesis for arguments list.',
    );
    const args =
      this.at().type === TokenType.CloseParen ? [] : this.parseArgumentsList();

    this.expect(
      TokenType.CloseParen,
      '💀 Expected closing parenthesis for arguments list.',
    );

    return args;
  }

  /**
   * Parses a list of arguments
   */
  private parseArgumentsList(): Expression[] {
    const args = [this.parseExpression()];

    while (this.at().type === TokenType.Comma && this.eat()) {
      args.push(this.parseAssignmentExpression());
    }

    return args;
  }

  private parseMemberExpression(): Expression {
    let object = this.parsePrimaryExpression();

    while (
      this.at().type === TokenType.Dot ||
      this.at().type === TokenType.OpenBracket
    ) {
      const operator = this.eat();
      let property: Expression;
      let computed: boolean;

      // non-computed values
      if (operator.type === TokenType.Dot) {
        computed = false;
        property = this.parsePrimaryExpression();

        if (property.kind !== 'Identifier') {
          throw '💀 Expected identifier for property name.';
        }
      } else {
        computed = true;
        property = this.parseExpression();
        this.expect(TokenType.CloseBracket, '💀 Expected closing bracket.');
      }
      object = {
        kind: 'MemberExpression',
        object,
        property,
        computed,
      } as MemberExpression;
    }

    return object;
  }

  /**
   * Parses Literal Values and Grouping Expressions
   */
  private parsePrimaryExpression(): Expression {
    const token = this.at().type;

    // Determine which token we are currently at and return literal value
    switch (token) {
      // User defined values.
      case TokenType.Identifier:
        return { kind: 'Identifier', symbol: this.eat().value } as Identifier;

      // Constants and Numeric Constants
      case TokenType.Number:
        return {
          kind: 'NumericLiteral',
          value: parseFloat(this.eat().value),
        } as NumericLiteral;

      case TokenType.String:
        return {
          kind: 'StringLiteral',
          value: this.eat().value,
        } as StringLiteral;

      // Grouping Expressions
      case TokenType.OpenParen:
        this.eat(); // Eat the opening parenthesis
        const value = this.parseExpression();
        this.expect(
          TokenType.CloseParen,
          '💀 Unexpected token found inside parenthesised expression. Expected closing parenthesis.',
        ); // Eat the closing parenthesis
        return value;

      // Unidentified Tokens and Invalid Code Reached
      default:
        console.error('💀 Unexpected token found during parsing: ', this.at());
        process.exit(1);
    }
  }

  /**
   * Produces an Abstract Syntax Tree from the source code.
   * @param sourceCode Source code to be parsed.
   * @returns Abstract Syntax Tree (AST) of the source code.
   */
  public produceAST(sourceCode: string): Program {
    this.tokens = tokenize(sourceCode);

    const program: Program = {
      kind: 'Program',
      body: [],
    };

    // Parse until end of file.
    while (this.notEOF()) {
      program.body.push(this.parseStatement());
    }

    return program;
  }
}
