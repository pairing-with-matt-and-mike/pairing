/*
  Your task is to implement a simple regular expression parser. We will have a parser that outputs the following AST of a regular expression:

data RegExp = Normal Char       -- ^ A character that is not in "()*|."
            | Any               -- ^ Any character
            | ZeroOrMore RegExp -- ^ Zero or more occurances of the same regexp
            | Or RegExp RegExp  -- ^ A choice between 2 regexps
            | Str [RegExp]      -- ^ A sequence of regexps.
As with the usual regular expressions, Any is denoted by the '.' character, ZeroOrMore is denoted by a subsequent '*' and Or is denoted by '|'. Brackets, ( and ), are allowed to group a sequence of regular expressions into the Str object.

Or is not associative, so "a|(a|a)" and "(a|a)|a" are both valid regular expressions, whereas "a|a|a" is not.

Operator precedences from highest to lowest are: *, sequencing and |. Therefore the followings hold:

========
"ab|a"    -> Or (Str [Normal 'a',Normal 'b']) (Normal 'a')
"a(b|a)"  -> Str [Normal 'a',Or (Normal 'b') (Normal 'a')]
"a|b*"    -> Or (Normal 'a') (ZeroOrMore (Normal 'b'))
"(a|b)*"  -> ZeroOrMore (Or (Normal 'a') (Normal 'b'))
Some examples:

"a.*"        -> Str [ Normal 'a', ZeroOrMore Any ]
"(a.*)|(bb)" -> Or (Str [Normal a, ZeroOrMore Any]) (Str [Normal 'b', Normal 'b'])
=====

The followings are invalid regexps and the parser should return Nothing in Haskell / 0 in C or C++ / null in JavaScript or C# / "" in Python / new Void() in Java/Void() in Kotlin:

"", ")(", "*", "a(", "()", "a**", etc.

Feel free to use any parser combinator libraries available on codewars, or implement the parser "from scratch".
  */

type DinkyRe =
    | {type: "any"}
    | {type: "normal", value: string}
    | {type: "zeroOrMore", value: DinkyRe}
    | Array<DinkyRe>;

const anyChar: DinkyRe = {type: "any"};

function normal(value: string): DinkyRe {
    return {type: "normal", value};
}

function zeroOrMore(value: DinkyRe): DinkyRe {
    return {type: 'zeroOrMore', value};
}

function append(result: DinkyRe | null, re: DinkyRe): DinkyRe {
    // return [...toArray(result), ...toArray(re)];
    if (result == null) {
        return re;
    } else if (Array.isArray(result) && Array.isArray(re)) {
        return [...result, ...re];
    } else if (Array.isArray(re)) {
        return [result, ...re];
    } else if (Array.isArray(result)) {
        return [...result, re];
    } else {
        return [result, re];
    }
}

function parse(s: string): DinkyRe | null {
    let result: DinkyRe | null = null;
    let fudge: Array<DinkyRe | null> = [];
    s.split("").forEach((c, i) => {
        switch (c) {
            case '(':
                fudge.push(result);
                result = null;
                break;
            case ')':
                if (result == null) {
                    throw "Empty group";
                } else {
                    result = append(fudge.pop() || null,
                                    (s[i+1] === '*') ? [result] : result);
                }
                fudge = [];
                break;
            case '.':
                result = append(result, anyChar)
                break;
            case '*':
                if (result === null) {
                    throw "BOOM";
                } else {
                    if (Array.isArray(result)) {
                        const zom = zeroOrMore(result[result.length - 1])
                        if (result.length === 1) {
                            result = zom;
                        } else {
                            result = [
                                ...result.slice(0, -1),
                                zom
                            ];
                        }
                    } else {
                        result = zeroOrMore(result);
                    }
                }
                break;
            default:
                result = append(result, normal(c));
                break;
        }
    });
    return result;
}

describe('regex', () => {
    it('single char', () => {
        let result = parse('a');
        expect(result).toEqual(normal('a'));
    });
    it('two chars', () => {
        let result = parse('ab');
        expect(result).toEqual([normal('a'), normal('b')]);
    });
    it('any', () => {
        let result = parse('.');
        expect(result).toEqual(anyChar);
    });
    it('two anys', () => {
        let result = parse('..');
        expect(result).toEqual([anyChar, anyChar]);
    });
    it('zero or more chars', () => {
        let result = parse('a*');
        expect(result).toEqual(zeroOrMore(normal('a')));
    });
    it('three chars', () => {
        let result = parse('abc');
        expect(result).toEqual([normal('a'), normal('b'), normal('c')]);
    });
    it('single char followed by zero or more chars', () => {
        let result = parse('ab*');
        expect(result).toEqual([normal('a'), zeroOrMore(normal('b'))]);
    });
    it('group', () => {
        let result = parse('(ab)');
        expect(result).toEqual([normal('a'), normal('b')]);
    });
    it('zero or more ab', () => {
        let result = parse('a(ab)c');
        expect(result).toEqual([normal('a'),
                                normal('a'), normal('b'),
                                normal('c')]);
    });
    it('zero or more ab', () => {
        let result = parse('(ab)*');
        expect(result).toEqual(zeroOrMore([normal('a'), normal('b')]));
    });
    it('zero or more ab', () => {
        let result = parse('a(bc)*');
        expect(result).toEqual([normal('a'),
                                zeroOrMore([normal('b'), normal('c')])]);
    });
});
