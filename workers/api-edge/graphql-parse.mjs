/**
 * GraphQL 词法与语法分析，逐行复刻 server/internal/httpapi/graphql_parse.go。
 *
 * 为什么不用 graphql-js：对外契约（docs/api-query.md §5）承诺的是一个**受限**
 * 解析器——不支持 directive、introspection、block string——而且解析错误的文案
 * 与**字节偏移**都是既成契约（`GraphQL parse error near byte 12: unterminated
 * selection set`）。graphql-js 给的是 spec 全集加 line/column，两头都对不上，
 * 引进来还得把一半特性手动关掉。这个语法很小，手抄反而更省也更准。
 *
 * ⚠️ Go 的 lexer 在**字节**上跑，位置是字节偏移，所以这里也必须在 Uint8Array
 * 上跑：用 JS 字符串会让中文的偏移与切分行为都对不上。
 */

const EOF = 0;
const NAME = 1;
const STRING = 2;
const INT = 3;
const PUNCT = 4;
const SPREAD = 5;

const PUNCT_BYTES = new Set([..."!$():=@[]{|}&"].map((c) => c.charCodeAt(0)));

/** 解析错误统一走这个类型，调用方据此判断该放进 errors 数组还是 400。 */
export class GraphParseError extends Error {}

const parseErr = (pos, message) =>
  new GraphParseError(`GraphQL parse error near byte ${pos}: ${message}`);

/**
 * 复刻 Go 的 unicode.IsLetter(rune(ch))，其中 ch 是**单字节**。
 * 0x80–0xFF 的字节会被当成对应的 Latin-1 码点，其中一部分确实是字母——
 * 于是 UTF-8 中文的首字节（0xE4 等）在 Go 那边算 name start。这不是设计，
 * 是既成行为，必须照抄，否则同一个查询两边切出来的 token 不一样。
 */
function isLetterByte(ch) {
  if ((ch >= 0x41 && ch <= 0x5a) || (ch >= 0x61 && ch <= 0x7a)) return true;
  if (ch < 0x80) return false;
  // Latin-1 补充区里的字母：ª µ º，以及 À–Ö Ø–ö ø–ÿ（× ÷ 不是字母）
  return (
    ch === 0xaa || ch === 0xb5 || ch === 0xba ||
    (ch >= 0xc0 && ch <= 0xd6) ||
    (ch >= 0xd8 && ch <= 0xf6) ||
    (ch >= 0xf8 && ch <= 0xff)
  );
}

const isNameStart = (ch) => ch === 0x5f /* _ */ || isLetterByte(ch);
const isNameContinue = (ch) => isNameStart(ch) || (ch >= 0x30 && ch <= 0x39);
const isWhitespace = (ch) => ch === 0x20 || ch === 0x09 || ch === 0x0a || ch === 0x0d;

const utf8 = new TextEncoder();
const decoder = new TextDecoder();

/**
 * 复刻 strconv.Unquote 在双引号字符串上的行为（够用的子集）：
 * 认 \" \\ \/ \b \f \n \r \t \uXXXX 与 Go 特有的 \xHH、\OOO 八进制；
 * 裸换行与未知转义视为非法。失败返回 null，调用方报 "invalid string"。
 */
function goUnquote(bytes, start, end) {
  // bytes[start] 与 bytes[end-1] 都是 '"'
  const out = [];
  let i = start + 1;
  const last = end - 1;
  while (i < last) {
    const ch = bytes[i];
    if (ch === 0x0a || ch === 0x0d) return null; // 裸换行：Go 不接受
    if (ch !== 0x5c /* \ */) {
      out.push(ch);
      i++;
      continue;
    }
    i++;
    if (i >= last) return null;
    const esc = bytes[i];
    i++;
    switch (esc) {
      case 0x22: out.push(0x22); break; // \"
      case 0x5c: out.push(0x5c); break; // \\
      case 0x2f: out.push(0x2f); break; // \/
      case 0x62: out.push(0x08); break; // \b
      case 0x66: out.push(0x0c); break; // \f
      case 0x6e: out.push(0x0a); break; // \n
      case 0x72: out.push(0x0d); break; // \r
      case 0x74: out.push(0x09); break; // \t
      case 0x76: out.push(0x0b); break; // \v
      case 0x61: out.push(0x07); break; // \a
      case 0x27: out.push(0x27); break; // \'
      case 0x75: { // \uXXXX
        if (i + 4 > last) return null;
        const hex = decoder.decode(bytes.subarray(i, i + 4));
        if (!/^[0-9a-fA-F]{4}$/.test(hex)) return null;
        i += 4;
        out.push(...utf8.encode(String.fromCharCode(parseInt(hex, 16))));
        break;
      }
      case 0x55: { // \UXXXXXXXX
        if (i + 8 > last) return null;
        const hex = decoder.decode(bytes.subarray(i, i + 8));
        if (!/^[0-9a-fA-F]{8}$/.test(hex)) return null;
        i += 8;
        const cp = parseInt(hex, 16);
        if (cp > 0x10ffff) return null;
        out.push(...utf8.encode(String.fromCodePoint(cp)));
        break;
      }
      case 0x78: { // \xHH
        if (i + 2 > last) return null;
        const hex = decoder.decode(bytes.subarray(i, i + 2));
        if (!/^[0-9a-fA-F]{2}$/.test(hex)) return null;
        i += 2;
        out.push(parseInt(hex, 16));
        break;
      }
      default:
        if (esc >= 0x30 && esc <= 0x37) { // \OOO 八进制
          if (i + 2 > last) return null;
          const oct = decoder.decode(bytes.subarray(i - 1, i + 2));
          if (!/^[0-7]{3}$/.test(oct)) return null;
          i += 2;
          const v = parseInt(oct, 8);
          if (v > 255) return null;
          out.push(v);
          break;
        }
        return null;
    }
  }
  return decoder.decode(new Uint8Array(out));
}

/** 复刻 lexGraph。输入是原始查询串，内部转成字节跑。 */
export function lexGraph(input) {
  const bytes = utf8.encode(input);
  const tokens = [];
  let pos = 0;
  while (pos < bytes.length) {
    const ch = bytes[pos];
    if (isWhitespace(ch) || ch === 0x2c /* , */) {
      pos++;
      continue;
    }
    if (ch === 0x23 /* # */) {
      while (pos < bytes.length && bytes[pos] !== 0x0a && bytes[pos] !== 0x0d) pos++;
      continue;
    }
    if (isNameStart(ch)) {
      const start = pos;
      pos++;
      while (pos < bytes.length && isNameContinue(bytes[pos])) pos++;
      tokens.push({ kind: NAME, text: decoder.decode(bytes.subarray(start, pos)), pos: start });
      continue;
    }
    if (ch === 0x2d /* - */ || (ch >= 0x30 && ch <= 0x39)) {
      const start = pos;
      pos++;
      while (pos < bytes.length && bytes[pos] >= 0x30 && bytes[pos] <= 0x39) pos++;
      tokens.push({ kind: INT, text: decoder.decode(bytes.subarray(start, pos)), pos: start });
      continue;
    }
    if (ch === 0x22 /* " */) {
      const start = pos;
      if (bytes[pos + 1] === 0x22 && bytes[pos + 2] === 0x22) {
        throw parseErr(pos, "block strings are not supported");
      }
      pos++;
      let escaped = false;
      let closed = false;
      while (pos < bytes.length) {
        const current = bytes[pos];
        pos++;
        if (escaped) {
          escaped = false;
          continue;
        }
        if (current === 0x5c /* \ */) {
          escaped = true;
          continue;
        }
        if (current === 0x22) {
          const decoded = goUnquote(bytes, start, pos);
          if (decoded === null) throw parseErr(start, "invalid string");
          tokens.push({ kind: STRING, text: decoded, pos: start });
          closed = true;
          break;
        }
      }
      if (!closed) throw parseErr(start, "unterminated string");
      continue;
    }
    if (bytes[pos] === 0x2e && bytes[pos + 1] === 0x2e && bytes[pos + 2] === 0x2e) {
      tokens.push({ kind: SPREAD, text: "...", pos });
      pos += 3;
      continue;
    }
    if (PUNCT_BYTES.has(ch)) {
      tokens.push({ kind: PUNCT, text: String.fromCharCode(ch), pos });
      pos++;
      continue;
    }
    // Go 的 %q 会给字符加单引号并转义；单字节非 ASCII 走 Latin-1 码点。
    throw parseErr(pos, `unexpected character ${goQuoteRune(ch)}`);
  }
  tokens.push({ kind: EOF, text: "", pos: bytes.length });
  return tokens;
}

/** 复刻 Go 的 %q（作用在 rune 上）：单引号包裹，非可打印按 \xNN / \uNNNN 转义。 */
function goQuoteRune(code) {
  const ch = String.fromCharCode(code);
  if (ch === "'") return "'\\''";
  if (ch === "\\") return "'\\\\'";
  if (code >= 0x20 && code < 0x7f) return `'${ch}'`;
  const named = { 7: "\\a", 8: "\\b", 9: "\\t", 10: "\\n", 11: "\\v", 12: "\\f", 13: "\\r" };
  if (named[code]) return `'${named[code]}'`;
  if (code < 0x80) return `'\\x${code.toString(16).padStart(2, "0")}'`;
  return `'\\u${code.toString(16).padStart(4, "0")}'`;
}

/** 变量引用的标记类型，resolveGraphValue 据此替换。 */
export class GraphVariable {
  constructor(name) {
    this.name = name;
  }
}

class Parser {
  constructor(tokens, maxDepth) {
    this.tokens = tokens;
    this.index = 0;
    this.maxDepth = maxDepth;
  }

  peek() {
    return this.index >= this.tokens.length ? { kind: EOF, text: "", pos: 0 } : this.tokens[this.index];
  }

  next() {
    const tok = this.peek();
    if (this.index < this.tokens.length) this.index++;
    return tok;
  }

  /** 注意错误位置取的是**当前** token（peek），不是刚消费掉的那个——与 Go 一致。 */
  fail(message) {
    return parseErr(this.peek().pos, message);
  }

  expectName() {
    const tok = this.next();
    if (tok.kind !== NAME) throw this.fail("expected a name");
    return tok.text;
  }

  expectNameText(want) {
    const name = this.expectName();
    if (name !== want) throw this.fail(`expected ${JSON.stringify(want)}`);
    return name;
  }

  expectPunct(want) {
    const tok = this.next();
    if (tok.kind !== PUNCT || tok.text !== want) {
      throw this.fail(`expected ${JSON.stringify(want)}`);
    }
  }

  skipBalanced(open, close) {
    this.expectPunct(open);
    let depth = 1;
    while (depth > 0) {
      const tok = this.next();
      if (tok.kind === EOF) throw this.fail(`unterminated ${open}`);
      if (tok.kind !== PUNCT) continue;
      if (tok.text === open) depth++;
      else if (tok.text === close) depth--;
    }
  }

  parseOperation() {
    const kind = this.next().text;
    const op = { kind, name: "", selection: [] };
    if (this.peek().kind === NAME) op.name = this.next().text;
    if (this.peek().kind === PUNCT && this.peek().text === "(") this.skipBalanced("(", ")");
    if (this.peek().kind === PUNCT && this.peek().text === "@") {
      throw this.fail("directives are not supported");
    }
    op.selection = this.parseSelectionSet(1);
    return op;
  }

  parseFragment(doc) {
    this.next(); // fragment
    const name = this.expectName();
    this.expectNameText("on");
    this.expectName(); // 类型条件：能选哪些字段由 schema 控制，这里不校验
    const selection = this.parseSelectionSet(1);
    if (Object.hasOwn(doc.fragments, name)) {
      throw this.fail(`fragment ${JSON.stringify(name)} is defined more than once`);
    }
    doc.fragments[name] = selection;
  }

  parseSelectionSet(depth) {
    if (depth > this.maxDepth) throw this.fail(`query exceeds maximum depth of ${this.maxDepth}`);
    this.expectPunct("{");
    const fields = [];
    for (;;) {
      if (this.peek().kind === EOF) throw this.fail("unterminated selection set");
      if (this.peek().kind === PUNCT && this.peek().text === "}") {
        this.next();
        return fields;
      }
      fields.push(this.parseField(depth));
    }
  }

  parseField(depth) {
    if (this.peek().kind === SPREAD) {
      this.next();
      if (this.peek().kind === NAME && this.peek().text === "on") {
        this.next();
        this.expectName();
        // 内联 fragment 直接展开；字段是否合法由具体对象的 resolver 判定
        return { inlineSelection: this.parseSelectionSet(depth + 1) };
      }
      return { spreadName: this.expectName() };
    }
    const name = this.expectName();
    const field = { name, alias: "" };
    if (this.peek().kind === PUNCT && this.peek().text === ":") {
      this.next();
      field.alias = name;
      field.name = this.expectName();
    }
    if (this.peek().kind === PUNCT && this.peek().text === "(") {
      field.args = this.parseArguments();
    }
    if (this.peek().kind === PUNCT && this.peek().text === "@") {
      throw this.fail("directives are not supported");
    }
    if (this.peek().kind === PUNCT && this.peek().text === "{") {
      field.selection = this.parseSelectionSet(depth + 1);
    }
    return field;
  }

  parseArguments() {
    this.expectPunct("(");
    const args = new Map();
    for (;;) {
      if (this.peek().kind === PUNCT && this.peek().text === ")") {
        this.next();
        return args;
      }
      const name = this.expectName();
      if (args.has(name)) throw this.fail(`argument ${JSON.stringify(name)} appears more than once`);
      this.expectPunct(":");
      args.set(name, this.parseValue());
    }
  }

  parseValue() {
    const tok = this.next();
    if (tok.kind === STRING) return tok.text;
    if (tok.kind === INT) {
      // Go 是 strconv.Atoi："-" 或空串都会失败
      if (!/^[+-]?\d+$/.test(tok.text)) throw this.fail("invalid integer");
      const value = Number(tok.text);
      if (!Number.isSafeInteger(value)) throw this.fail("invalid integer");
      return value;
    }
    if (tok.kind === NAME) {
      if (tok.text === "true") return true;
      if (tok.text === "false") return false;
      if (tok.text === "null") return null;
      return tok.text; // enum 以字符串表示
    }
    if (tok.kind === PUNCT) {
      if (tok.text === "$") return new GraphVariable(this.expectName());
      if (tok.text === "[") return this.parseListValue();
      if (tok.text === "{") return this.parseObjectValue();
    }
    throw this.fail("expected a GraphQL value");
  }

  parseListValue() {
    const values = [];
    for (;;) {
      if (this.peek().kind === PUNCT && this.peek().text === "]") {
        this.next();
        return values;
      }
      values.push(this.parseValue());
    }
  }

  parseObjectValue() {
    const object = new Map();
    for (;;) {
      if (this.peek().kind === PUNCT && this.peek().text === "}") {
        this.next();
        return object;
      }
      const name = this.expectName();
      if (object.has(name)) throw this.fail(`input field ${JSON.stringify(name)} appears more than once`);
      this.expectPunct(":");
      object.set(name, this.parseValue());
    }
  }
}

/** 复刻 parseGraphDocument。maxDepth 由调用方传（Go 侧是 maxGraphQLDepth=8）。 */
export function parseGraphDocument(input, maxDepth) {
  const p = new Parser(lexGraph(input), maxDepth);
  const doc = { operations: [], fragments: {} };
  while (p.peek().kind !== EOF) {
    const tok = p.peek();
    if (tok.kind === PUNCT && tok.text === "{") {
      doc.operations.push({ kind: "query", name: "", selection: p.parseSelectionSet(1) });
      continue;
    }
    if (tok.kind !== NAME) throw p.fail("expected operation or fragment");
    if (tok.text === "query" || tok.text === "mutation" || tok.text === "subscription") {
      doc.operations.push(p.parseOperation());
    } else if (tok.text === "fragment") {
      p.parseFragment(doc);
    } else {
      throw p.fail("expected query, mutation, subscription, or fragment");
    }
  }
  // 这条不带字节偏移——Go 用的是 fmt.Errorf 而不是 p.errorf
  if (doc.operations.length === 0) throw new GraphParseError("document must contain an operation");
  return doc;
}

/** 复刻 graphDocument.operation。 */
export function selectOperation(doc, name) {
  if (name) {
    const found = doc.operations.find((op) => op.name === name);
    if (!found) throw new Error(`operation ${JSON.stringify(name)} was not found`);
    return found;
  }
  if (doc.operations.length !== 1) {
    throw new Error("operationName is required when a document has multiple operations");
  }
  return doc.operations[0];
}

/** 复刻 graphDocument.expand：展开 fragment 与内联 fragment，检测递归。 */
export function expandFields(doc, fields, stack = new Set()) {
  const out = [];
  for (const field of fields) {
    if (field.inlineSelection) {
      out.push(...expandFields(doc, field.inlineSelection, stack));
      continue;
    }
    if (!field.spreadName) {
      out.push(field);
      continue;
    }
    if (stack.has(field.spreadName)) {
      throw new Error(`fragment ${JSON.stringify(field.spreadName)} is recursive`);
    }
    const fragment = doc.fragments[field.spreadName];
    if (!fragment) throw new Error(`fragment ${JSON.stringify(field.spreadName)} was not found`);
    stack.add(field.spreadName);
    try {
      out.push(...expandFields(doc, fragment, stack));
    } finally {
      stack.delete(field.spreadName);
    }
  }
  return out;
}

/** 复刻 resolveGraphValue：把 $var 换成实参，递归处理数组与对象。 */
export function resolveGraphValue(value, variables) {
  if (value instanceof GraphVariable) {
    if (!variables || !Object.hasOwn(variables, value.name)) {
      throw new Error(`variable $${value.name} was not supplied`);
    }
    return variables[value.name];
  }
  if (Array.isArray(value)) return value.map((v) => resolveGraphValue(v, variables));
  if (value instanceof Map) {
    const out = {};
    for (const [key, child] of value) out[key] = resolveGraphValue(child, variables);
    return out;
  }
  return value;
}

/** 字段的响应键：有 alias 用 alias。 */
export const responseKey = (field) => field.alias || field.name;
