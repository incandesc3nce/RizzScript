/**
 * Represents tokens the language understands in parsing.
 */
export enum TokenType {
  // Literal types
  Number,
  Identifier,
  String,

  // Keywords
  Let,
  Const,
  Fn,
  If,
  Else,
  For,

  // Grouping * Operators
  BinaryOperator,
  Equals, // =
  Comma, // ,
  Dot, // .
  Colon, // :
  Semicolon, // ;
  OpenParen, // (
  CloseParen, // )
  OpenBrace, // {
  CloseBrace, // }
  OpenBracket, // [
  CloseBracket, // ]
  Quotation, // "
  Greater, // >
  Lesser, // <
  EqualsCompare, // ==
  NotEqualsCompare, // !=
  Exclamation, // !
  And, // &&
  Ampersand, // &
  Bar, // |
  Ternary, // ->

  EOF, // End of file
  NewLine, // New line
}

/**
 * Constant lookup for keywords and known identifiers + symbols.
 */
const KEYWORDS: Record<string, TokenType> = {
  let: TokenType.Let,
  const: TokenType.Const,
  fn: TokenType.Fn,
  if: TokenType.If,
  else: TokenType.Else,
  for: TokenType.For,
};

/**
 * Constant lookup for known symbols.
 */
const TOKEN_CHARS: Record<string, TokenType> = {
  '(': TokenType.OpenParen,
  ')': TokenType.CloseParen,
  '{': TokenType.OpenBrace,
  '}': TokenType.CloseBrace,
  '[': TokenType.OpenBracket,
  ']': TokenType.CloseBracket,
  '+': TokenType.BinaryOperator,
  '-': TokenType.BinaryOperator,
  '*': TokenType.BinaryOperator,
  '%': TokenType.BinaryOperator,
  '/': TokenType.BinaryOperator,
  '<': TokenType.Lesser,
  '>': TokenType.Greater,
  '.': TokenType.Dot,
  ';': TokenType.Semicolon,
  ':': TokenType.Colon,
  ',': TokenType.Comma,
  '|': TokenType.Bar,
  '\n': TokenType.NewLine,
};

/**
 * Constant lookup for escaped characters in strings.
 */
const ESCAPED: Record<string, string> = {
  n: '\n',
  t: '\t',
  r: '\r',
};

/**
 * Reverse lookup for token types.
 */
const reverseTokenType: Record<number, string> = Object.keys(TokenType)
  .filter((key) => typeof TokenType[key as keyof typeof TokenType] === 'number')
  .reduce(
    (obj, key) => {
      obj[TokenType[key as keyof typeof TokenType]] = key;
      return obj;
    },
    {} as Record<number, string>,
  );

/**
 * Represents a single token in the source code.
 */
export interface Token {
  value: string;
  type: TokenType;
  raw: string;
  toString: () => object;
}

/**
 * Converts individual character into a Token object.
 * @param value - character
 * @param type - token type character corresponds to
 */
function token(
  value: string = '',
  type: TokenType,
  raw: string = value,
): Token {
  return {
    value,
    type,
    raw,
    toString: () => {
      return { value, type: reverseTokenType[type] };
    },
  };
}

/**
 * Checks whether the character passed in alphabetic -> [a-zA-Z] and _
 */
function isAlpha(src: string, isFirstChar: boolean = false): boolean {
  if (isFirstChar) {
    return /^[A-Za-z_]+$/.test(src);
  }
  return /^[A-Za-z0-9_]+$/.test(src);
}

/**
 * Checks if the character is whitespace
 */
function isSkippable(str: string): boolean {
  return str === ' ' || str === '\n' || str === '\t' || str === '\r';
}

/**
 * Checks whether the character is a valid integer -> [0-9]
 */
function isInt(str: string): boolean {
  const c = str.charCodeAt(0);
  const bounds = ['0'.charCodeAt(0), '9'.charCodeAt(0)];

  return c >= bounds[0] && c <= bounds[1];
}

function getPrevIdents(tokens: Array<Token>): Token[] | null {
  const reversed = [...tokens].reverse();
  const newTokens: Token[] = [];
  for (const token of reversed) {
    if (
      token.type == TokenType.Identifier ||
      token.type == TokenType.Dot ||
      token.type == TokenType.OpenBracket ||
      token.type == TokenType.CloseBracket ||
      (tokens[tokens.length - newTokens.length - 2] &&
        tokens[tokens.length - newTokens.length - 2].type ==
          TokenType.OpenBracket &&
        token.type == TokenType.Number)
    ) {
      newTokens.push(token);
    } else {
      break;
    }
  }
  return newTokens.length > 0 ? newTokens.reverse() : null;
}

/**
 * Given a string representing source code produces tokens and handles
 * possible unidentified characters.
 *
 * - Returns an array of tokens.
 * - Does not modify the incoming string.
 */
export function tokenize(sourceCode: string): Token[] {
  const tokens = new Array<Token>();
  const src = sourceCode.split('');

  // produce tokens until the EOF is reached.
  while (src.length > 0) {
    const char = src[0];

    const tokenType = TOKEN_CHARS[char];
    if (isInt(char) || (char == '-' && isInt(src[1]))) {
      let num = src.shift();
      let period = false;
      while (src.length > 0) {
        if (src[0] == '.' && !period) {
          period = true;
          num += src.shift()!;
        } else if (isInt(src[0])) {
          num += src.shift()!;
        } else break;
      }

      // append new numeric token.
      tokens.push(token(num, TokenType.Number));
    } else {
      switch (char) {
        case '=':
          src.shift();
          if (src[0] == '=') {
            src.shift();
            tokens.push(token('==', TokenType.EqualsCompare));
          } else {
            tokens.push(token('=', TokenType.Equals));
          }
          break;
        case '&':
          src.shift();
          if (src[0] == '&') {
            src.shift();
            tokens.push(token('&&', TokenType.And));
          } else {
            tokens.push(token('&', TokenType.Ampersand));
          }
          break;
        case '!':
          src.shift();
          if (String(src[0]) == '=') {
            src.shift();
            tokens.push(token('!=', TokenType.NotEqualsCompare));
          } else {
            tokens.push(token('!', TokenType.Exclamation));
          }
          break;
        case '"': {
          let str = '';
          let raw = '';
          src.shift();

          let escaped = false;
          while (src.length > 0) {
            const key = src.shift() as string;
            raw += key;
            if (key == '\\') {
              escaped = !escaped;
              if (escaped) continue;
            } else if (key == '"') {
              if (!escaped) {
                break;
              }
              escaped = false;
            } else if (escaped) {
              escaped = false;
              if (ESCAPED[key]) {
                str += ESCAPED[key];
                continue;
              } else {
                str += `\\`;
              }
            }
            str += key;
          }

          // append new string token.
          tokens.push(
            token(str, TokenType.String, raw.substring(0, raw.length - 1)),
          );
          break;
        }
        case '-':
          if (src[1] == '>') {
            src.shift();
            src.shift();
            tokens.push(token('->', TokenType.Ternary));
            break;
          } else if (src[1] != src[0]) {
            const previdents = getPrevIdents(tokens);
            if (
              previdents == null &&
              tokens[tokens.length - 1].type != TokenType.CloseParen
            ) {
              tokens.push(token('0', TokenType.Number));
              tokens.push(token(src.shift(), TokenType.BinaryOperator));
              break;
            }
          }
        case '+':
          if (src[1] == src[0]) {
            const prevtokens = getPrevIdents(tokens);
            if (prevtokens != null) {
              tokens.push(token('=', TokenType.Equals));
              prevtokens.forEach((token) => tokens.push(token));
              tokens.push(token(src.shift(), TokenType.BinaryOperator));
              tokens.push(token('1', TokenType.Number));
              src.shift();
              break;
            }
          }
        case '*':
        case '/':
          if (src[1] == '=') {
            const prevtokens = getPrevIdents(tokens);
            if (prevtokens == null) break;

            tokens.push(token('=', TokenType.Equals));
            prevtokens.forEach((token) => tokens.push(token));
            tokens.push(token(src.shift(), TokenType.BinaryOperator));
            src.shift();
            break;
          } else if (src[0] == '/') {
            if (src[1] == '*') {
              let lastVal = '';
              while (src.length > 0) {
                const nextVal = src.shift() as string;

                if (lastVal == '*' && nextVal == '/') {
                  break;
                }

                lastVal = nextVal;
              }
              break;
            } else if (src[1] == '/') {
              do {
                src.shift();
              } while (src.length > 0 && (src[0] as string) != '\n'); // fuck off typescript
              src.shift();
              break;
            }
          }
        default:
          if (tokenType) {
            tokens.push(token(src.shift(), tokenType));
          } else if (isAlpha(char, true)) {
            let ident = '';
            ident += src.shift(); // Add first character which is alphabetic or underscore

            while (src.length > 0 && isAlpha(src[0])) {
              ident += src.shift(); // Subsequent characters can be alphanumeric or underscore
            }

            // CHECK FOR RESERVED KEYWORDS
            const reserved = KEYWORDS[ident];
            // If value is not undefined then the identifier is
            // recognized keyword
            if (typeof reserved == 'number') {
              tokens.push(token(ident, reserved));
            } else {
              // Unrecognized name must mean user-defined symbol.
              tokens.push(token(ident, TokenType.Identifier));
            }
          } else if (isSkippable(src[0])) {
            // Skip unneeded chars.
            src.shift();
          } else {
            // Handle unrecognized characters.

            console.error(
              '💀 Unrecognized character found in source: ',
              src[0].charCodeAt(0),
              src[0],
            );
            process.exit(1);
          }
          break;
      }
    }
  }

  tokens.push(token('EndOfFile', TokenType.EOF));

  return tokens;
}
