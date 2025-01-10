# RizzScript

Yet another TypeScript esoteric programming language.

## Setup

Install the dependencies:

```bash
npm install
```

## Running

- To run a specific file: `npm run rizz <FILENAME>`
- To run in REPL mode: `npm run rizz`

## Examples

Examples can be found at `examples` directory. To run them, use the following command:

```bash
npm run rizz ./examples/<FILENAME>
```

Both versions of the language are present:

- `base.rizz` - The base version of the language (with the haha keywords)
- `transcribed.rizz` - The transcribed version of the language (with the original interpreter's keywords)

## Language

RizzScript features a custom interpreter built fully in TypeScript.
Interpreter can interpret regular, the usual keywords (see more in `/examples/transcribed.rizz`) and the brainrot and slang words (see more further or in `/examples/base.rizz`). 

Have fun!

## Variables

Mutable variables are created using `bet` keyword. Variables are assigned using `is` keyword:

```rs
bet x is 10 ahh
```

Constant variables can be created using `based` keyword:

```rs
based y is 20 ahh
```

**Note**: You can only use `ahh` on declaring a variable.

## Data Structures

### Strings

Strings can be created with double quotes:

```rs
bet x is "hello, world!" ahh
```

You can also insert variables using the `glue()` function:

```rs
bet x is 0 ahh
bet y is glue("hello, ", x) ahh // "hello, user"
```

You can use RizzScript helper functions to manipulate strings:

```rs
bet x is haircut(" hello ") ahh // "hello"
bet y is slash("hello,world", ",") ahh // ["hello", "world"]
```

### Numbers

Numbers are created as usual:

```rs
bet x is 10 ahh
bet aura is 20 ahh
bet guysAura is aura lose x ahh // 10
guysAura is guysAura gain x // 20

bet y is digits("123") ahh // 123
```

### Null

Null value is represented by `npc`:

```rs
bet x is npc ahh // null
```

### Booleans

Booleans are created using `deadass` and `cap`:

```rs
bet x is deadass ahh // true
bet y is cap ahh // false
```

### Objects

Objects are created using curly braces `{}`. Objects support referencing variables:

```rs
bet x is deadass ahh
based obj is { "key": cap, x } ahh

obj.key is deadass
yap(obj.key) // true
```

Getting/setting dynamic keys is possible using global `gang` object:

```rs
gang.get(obj, "key") // e.g. true
gang.set(obj, "key", false) // e.g. { "key": false }
```

You can also get info on the keys of an object using `gang`:

```rs
gang.hasKey(obj, "key1") // e.g. true
gang.keys(obj) // e.g. ["key1", "key2", "key3"]
```

### Arrays

Arrays contain information without keys. They are created using square brackets `[]`:

```rs
bet arr is [1, 2, 3] ahh

arr[0] = 5

yap(arr) // [5, 2, 3]
```

Array's indexes start at 0.

### Length of Data Structures

Lengths of strings, objects and arrays can be accessed using `len` global function:

```rs
bet x is "hello" ahh
bet y is [1, 2, 3] ahh
bet z is { "key": "value" } ahh

len(x) // 5
len(y) // 3
len(z) // 1
```

## Comments

Comments are created using `//`:

```rs
// This is a comment
```

Or using `/* */`:

```rs
/* This is a
   multiline comment */
```

## Functions

Function are created using `rizz` keyword:

```rs
rizz sayHello() {
  bet x is "hello" ahh
  yap(x)
}

sayHello() // "hello"
```

We, at RizzScript, believe that `return` is too mainstream. Instead, our supreme functions return the last value emitted.

```rs
rizz bruh(a, b) {
  a gain b // will do nothing
  a lose b // is returned
}
```

Functions can be ran after a specified timespan using `lag`:

```rs
lag(rizz() {
  yap("a few seconds later...")
}, 1500)
```

Functions can also be ran continously using `yappachino`:

```rs
yappachino(rizz() {
  yap("spams every second...")
}, 1000)
```

## If Statements

Design of the if statements in RizzScript is very human.:

```rs
sus (5 fr 5) {
  yap("5 is 5")
} goon sus (5 nah 2) {
  yap("5 is not 2")
} goon sus (1 fr 3 maybe 1 fr 1) {
  yap("1 is 3 or 1")
} goon sus (1 fr 3 btw 1 fr 1) {
  yap("1 is 1 and 3. i think something is wrong xd")
} goon {
  yap("no way you reached here")
}
```

## Loops

Loops in RizzScript are very simple:

```rs
grind (bet x is 0 ahh x smol 10 ahh x up) {
  yap(x)
}
```

We believe you should be responsible for your own loops. Therefore, we don't provide `break` or `continue` keyword functionality to loops.

## Try Catch

Try catch blocks are also very human:

```rs
fuck_around {
  yap(npc gain skibidi)
} find_out {
  yap(error)
}
```

```
💀 Cannot resolve skibidi as it does not exist.
```

**Note**: `find_out` doesn't return anything, as "error" is a global variable.

## Extras

### Math

Utilize math by using `nerd` keyword:

```rs
yap(nerd.random(0, 100)) // integer from 0-100
yap(nerd.sqrt(144)) // 12
yap(nerd.pi) // 3.141592653589793
yap(nerd.e) // 2.718281828459045
```

We also added helper functions for your anxiety:

```rs
yap(nerd.ceil(3.4)) // 4
yap(nerd.round(3.9)) // 4
yap(nerd.abs(-2)) // 2
```

You can also simplify your math equations:

```rs
x stack 5 // +=
y london 6 // -=
z ratio 2 // /=
i up // ++
i down // --
```

### Importing

You can `lock_in` data from another RizzScript file:

```rs
bet bro is lock_in("./bro.rizz") ahh
```

The last value emitted in a file will be the exported data:

```rs
rizz brosYapping1() {
    yap("RizzScript is bussin")
}
rizz brosYapping2() {
    yap("on god xd")
}

{
    brosYapping1,
    brosYapping2
}
```

If imported, the result will be an object, from which you can use obj.brosYapping1 and obj.brosYapping2

### HTTP Requests

Use `hit_up` to make HTTP requests:

```rs
hit_up("https://example.rizz/")(rizz(data) {
  yap(data)
})
```

You can also set the method, body and content type:

```rs
hit_up(
  "https://example.rizz/", 
  { method: "POST", 
  body: "{\"rizzscript\":\"on_god\"}", 
  content_type: "application/json" })
  (rizz(data) {
    yap(data)
  }
)
```

### Regex

Use `regex` to match a string with a regular expression pattern:

```rs
bet str is "hello world" ahh

bet matches is regex.match(str, "hello") ahh

yap(matches) // ["hello"]
```

Or replace a string with a regex pattern:

```rs
bet str is "hello world" ahh

yap(regex.replace(str, "world", "everybody")) // "hello everybody"
```

RZON

Rizz Object Notation 🗣️💯🔥 can be used with the `rzon` object:

```rs
rzon.parse("{\"rizzscript\": \"on_god\"}") // { rizzscript: "on_god" }
rzon.parse("[1, 2, 3]") // [1, 2, 3]
rzon.stringify({ rizzscript: "on_god" }) // '{"rizzscript": "on_god"}'
rzon.stringify([1, 2, 3]) // "[1, 2, 3]"
```

### Ternary Operator

RizzScript supports ternary operator using `then` keyword:

```rs
bet x is 10 ahh
bet y is x thicc 15 then "thicc" maybe "smol" ahh
```

### Exit

Exit the program using `exit()`:

```rs
exit()
// 🔥 srsly bruh...
```

# Credits

- Huge thanks to [Tyler Laceby](https://github.com/tlaceby) for creating the [Guide to Interpreters](https://github.com/tlaceby/guide-to-interpreters-series)!
- [FaceDev](https://www.youtube.com/@FaceDevStuff) for the idea
- [DreamBerd](https://github.com/TodePond/DreamBerd) for the inspiration

Created with love by incandesc3nce 💜
