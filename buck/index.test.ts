
interface Token {
    type: "value" | "plus" | "minus" | "multiply";
    value: string;
}

const Tokens = {
    value(value: string): Token {
        return {type: "value", value: value};
    },
    plus: {type: "plus", value: "+"} as Token,
    minus: {type: "minus", value: "-"} as Token,
    multiply: {type: "multiply", value: "*"} as Token,
}

type Expression =
    | {
        type: "value",
        value: number,
    }
    | {
        type: "plus",
        left: Expression,
        right: Expression,
    }
    | {
        type: "minus",
        left: Expression,
        right: Expression,
    }
    | {
        type: "multiply",
        left: Expression,
        right: Expression,
    }
    | {
        type: "negate",
        value: Expression,
    };

type PendingExpression =
    | {
        type: "literal" | "prefix" | "multiply" | "add",
        expression: Expression
    };

type Pending =
    | PendingExpression
    | {type: "plus-pending"}
    | {type: "minus-symbol"}
    | {type: "minus-pending"}
    | {type: "negate-pending"}
    | {type: "multiply-pending"};

function parse(tokens: Array<Token>): Expression {
    let stack = new Array<Pending>();
    tokens.forEach((token, i) => {
        switch (token.type) {
            case "value":
                stack.push({
                    type: "literal",
                    expression: literal(parseInt(token.value, 10))
                });
                break;
            case "plus":
                stack.push({type: 'plus-pending'});
                break;
            case "minus":
                stack.push({type: 'minus-symbol'});
                break;
            case "multiply":
                stack.push({type: 'multiply-pending'});
                break;
            default:
                throw new Error(`Unknown token: ${token.type}`);
        }
        stack = reduce(stack, tokens[i + 1]);
    });
    if (stack.length === 1) {
        return (stack[0] as PendingExpression).expression;
    } else {
        throw new Error(`Dangling tokens: ${JSON.stringify(stack, null, 2)}`);
    }
}

interface Reduction {
    types: Array<Pending["type"]>;
    reduce: (stack: Array<Pending>) => Array<Pending>;
    disallowedNextTokens: Array<string>;
}

const reductions: Array<Reduction> = [
    {
        types: ["add", "plus-pending", "multiply"],
        reduce: ([left, _, right]) => [{
            type: "add",
            expression: plus(
                (left as PendingExpression).expression,
                (right as PendingExpression).expression
            )
        }],
        disallowedNextTokens: ["multiply"],
    },
    {
        types: ["add", "minus-pending", "multiply"],
        reduce: ([left, _, right]) => [{
            type: "add",
            expression: minus(
                (left as PendingExpression).expression,
                (right as PendingExpression).expression
            )
        }],
        disallowedNextTokens: ["multiply"],
    },
    {
        types: ["multiply", "multiply-pending", "prefix"],
        reduce: ([left, _, right]) => [{
            type: "multiply",
            expression: multiply(
                (left as PendingExpression).expression,
                (right as PendingExpression).expression
            )
        }],
        disallowedNextTokens: [],
    },
    {
        types: ["negate-pending", "prefix"],
        reduce: ([_, operand]) => [{
            type: "prefix",
            expression: negate((operand as PendingExpression).expression)
        }],
        disallowedNextTokens: [],
    },
    {
        types: ["add", "minus-symbol"],
        reduce: ([a, m]) => [a, {type: "minus-pending"}],
        disallowedNextTokens: [],
    },
    {
        types: ["minus-symbol"],
        reduce: ([m]) => [{type: "negate-pending"}],
        disallowedNextTokens: [],
    },
    {
        types: ["literal"],
        reduce: ([pe]) => [{
            type: "prefix",
            expression: (pe as PendingExpression).expression
        }],
        disallowedNextTokens: [],
    },
    {
        types: ["prefix"],
        reduce: ([pe]) => [{
            type: "multiply",
            expression: (pe as PendingExpression).expression
        }],
        disallowedNextTokens: [],
    },
    {
        types: ["multiply"],
        reduce: ([pe]) => [{
            type: "add",
            expression: (pe as PendingExpression).expression
        }],
        disallowedNextTokens: ["multiply"],
    },
];

function reduce(stack: Array<Pending>, token: Token | null): Array<Pending> {
    for (const reduction of reductions) {
        const partialStack = stack.slice(-reduction.types.length);
        const canReduce = isArrayEqual(reduction.types, partialStack.map(pending => pending.type))
            && (token == null || !reduction.disallowedNextTokens.includes(token.type));
        if (canReduce) {
            return reduce([...stack.slice(0, -reduction.types.length),
                           ...reduction.reduce(partialStack)], token);
        }
    }
    return stack;
}

function isArrayEqual<T>(left: Array<T>, right: Array<T>): boolean {
    if (left.length !== right.length) {
        return false;
    }
    for (let i = 0; i < left.length; i++) {
        if (left[i] !== right[i]) {
            return false;
        }
    }
    return true;
}

function literal(n: number): Expression {
    return {
        type: "value",
        value: n
    };
}

function plus(left: Expression, right: Expression): Expression {
    return {
        type: "plus",
        left,
        right
    }
}

function minus(left: Expression, right: Expression): Expression {
    return {
        type: "minus",
        left,
        right
    }
}

function multiply(left: Expression, right: Expression): Expression {
    return {
        type: "multiply",
        left,
        right
    }
}

function negate(value: Expression): Expression {
    return {
        type: "negate",
        value
    }
}

describe('calculator', () => {
    it('1', () => {
        const tokens: Array<Token> = [
            Tokens.value("1")
        ];
        const ast = parse(tokens);
        expect(ast).toEqual(literal(1));
    });

    it('1 + 2', () => {
        const tokens: Array<Token> = [
            Tokens.value("1"),
            Tokens.plus,
            Tokens.value("2"),
        ];
        const ast = parse(tokens);
        expect(ast).toEqual(plus(literal(1), literal(2)));
    });

    it('1 + 2 + 3', () => {
        const tokens: Array<Token> = [
            Tokens.value("1"),
            Tokens.plus,
            Tokens.value("2"),
            Tokens.plus,
            Tokens.value("3"),
        ];
        const ast = parse(tokens);
        expect(ast).toEqual({
            type: "plus",
            left: plus(literal(1), literal(2)),
            right: literal(3),
        });
    });

    it('2 - 1', () => {
        const tokens: Array<Token> = [
            Tokens.value("2"),
            Tokens.minus,
            Tokens.value("1"),
        ];
        const ast = parse(tokens);
        expect(ast).toEqual(minus(literal(2), literal(1)));
    });

    it('-1', () => {
        const tokens: Array<Token> = [
            Tokens.minus,
            Tokens.value("1"),
        ];
        const ast = parse(tokens);
        expect(ast).toEqual(negate(literal(1)));
    });

    it('-2 + 1', () => {
        const tokens: Array<Token> = [
            Tokens.minus,
            Tokens.value("2"),
            Tokens.plus,
            Tokens.value("1"),
        ];
        const ast = parse(tokens);
        expect(ast).toEqual(plus(negate(literal(2)), literal(1)));
    });

    it('2 + -1', () => {
        const tokens: Array<Token> = [
            Tokens.value("2"),
            Tokens.plus,
            Tokens.minus,
            Tokens.value("1"),
        ];
        const ast = parse(tokens);
        expect(ast).toEqual(plus(literal(2), negate(literal(1))));
    });

    it('1 * 2 + 3 * 4', () => {
        const tokens: Array<Token> = [
            Tokens.value("1"),
            Tokens.multiply,
            Tokens.value("2"),
            Tokens.plus,
            Tokens.value("3"),
            Tokens.multiply,
            Tokens.value("4"),
        ];
        const ast = parse(tokens);
        expect(ast).toEqual(plus(
            multiply(literal(1), literal(2)),
            multiply(literal(3), literal(4))
        ));
    });
});
