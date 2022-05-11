from __future__ import annotations

import dataclasses
import enum
import pytest

class TokenType(enum.Enum):
    LCURLY=enum.auto()
    RCURLY=enum.auto()
    LPAREN=enum.auto()
    RPAREN=enum.auto()

class BracketType(enum.Enum):
    CURLY=enum.auto()
    PAREN=enum.auto()

@dataclasses.dataclass(frozen=True)
class TokensTransition:
    index: int
    inserts: List[Token]

    @staticmethod
    def insert(index, inserts):
        return TokensTransition(index, inserts)


@dataclasses.dataclass(frozen=True)
class Token:
    source: str
    type: TokenType

    @staticmethod
    def rparen(*, source):
        return Token(source=source, type=TokenType.RPAREN)

    @staticmethod
    def lcurly(*, source):
        return Token(source=source, type=TokenType.LCURLY)

    @staticmethod
    def rcurly(*, source):
        return Token(source=source, type=TokenType.RCURLY)

@dataclasses.dataclass(frozen=True)
class SourceTransition:
    index: int
    character: str

    @staticmethod
    def insert(index, character):
        return SourceTransition(index, character)

@dataclasses.dataclass(frozen=True)
class State:
    source: str
    tokens: List[Token]

def state_from_source(source):
    return State(source, enhance(tokenise(source)))

def generate_tokens_transition(state, source_transition):
    #new_tokens = tokenise(source_transition.character)
    if source_transition.character == "{":
        return [
            TokensTransition.insert(source_transition.index, Token.lcurly(source="{")),
            TokensTransition.insert(source_transition.index + 1, Token.rcurly(source="}")),
        ]

    return []

def enhance(tokens):
    stack = []
    result = []
    for token in tokens:

        while ((token.type == TokenType.RPAREN or
             token.type == TokenType.RCURLY) and
             len(stack) != 0 and
             token.type != _token_type_to_closing_token[stack[-1]].type):
            unclosed_token_type = stack.pop()
            result.append(_token_type_to_closing_token[unclosed_token_type])

        if token.type == TokenType.LPAREN:
            stack.append(BracketType.PAREN)
            result += [token]
        elif (token.type == TokenType.RPAREN and
              len(stack) != 0 and
              stack[-1] == BracketType.PAREN):
            stack.pop()
            result += [token]
        elif token.type == TokenType.LCURLY:
            stack.append(BracketType.CURLY)
            result += [token]
        elif (token.type == TokenType.RCURLY and
              len(stack) != 0 and
              stack[-1] == BracketType.CURLY):
            stack.pop()
            result += [token]

    return result + [
        _token_type_to_closing_token[token_type]
        for token_type in reversed(stack)
    ]

_token_type_to_closing_token = {
    BracketType.PAREN: Token.rparen(source=")"),
    BracketType.CURLY: Token.rcurly(source="}"),
}


def tokenise(source):
    if len(source) == 0:
        return []

    c = source[0]
    cs = source[1:]

    if c == "(":
        return [Token(c, TokenType.LPAREN), *tokenise(cs)]
    elif c == ")":
        return [Token(c, TokenType.RPAREN), *tokenise(cs)]
    elif c == "{":
        return [Token(c, TokenType.LCURLY), *tokenise(cs)]
    elif c == "}":
        return [Token(c, TokenType.RCURLY), *tokenise(cs)]

def test_can_parse_empty_source():
    source = ""
    result = enhance(tokenise(source))
    assert result == []

def test_can_parse_parens():
    source = "()"
    result = enhance(tokenise(source))
    assert result == [
        Token(source="(", type=TokenType.LPAREN),
        Token(source=")", type=TokenType.RPAREN)
    ]

@pytest.mark.parametrize("left, right", [
    ("(", "()"),
    ("((", "(())"),
    (")", ""),
    (")()", "()"),
    ("(()(", "(()())"),
    ("{", "{}"),
    ("{{", "{{}}"),
    ("}", ""),
    ("}{}", "{}"),
    ("{{}{", "{{}{}}"),
    ("({", "({})"),
    ("(}", "()"),
    ("{)", "{}"),
    ("{(}", "{()}"),
    ("({)", "({})"),
    ("))", ""),
    ("(({)())", "(({})())"),
    ("({{)())", "({{}})()"),
])
def test_enhance_fixes_mismatched_brackets(left, right):
    assert enhance(tokenise(left)) == enhance(tokenise(right))

def test_can_parse_curly_braces():
    source = "{}"
    result = enhance(tokenise(source))
    assert result == [
        Token(source="{", type=TokenType.LCURLY),
        Token(source="}", type=TokenType.RCURLY),
    ]

@pytest.mark.parametrize("source, source_transition, tokens_transition", [
    ("{", SourceTransition.insert(1, "}"), []),
    ("}", SourceTransition.insert(0, "{"), [
        TokensTransition.insert(0, Token(source="{", type=TokenType.LCURLY)),
        TokensTransition.insert(1, Token(source="}", type=TokenType.RCURLY)),
    ]),
    ("", SourceTransition.insert(0, "{"), [
        TokensTransition.insert(0, Token(source="{", type=TokenType.LCURLY)),
        TokensTransition.insert(1, Token(source="}", type=TokenType.RCURLY)),
    ]),
    ("()", SourceTransition.insert(2, "{"), [
        TokensTransition.insert(2, Token(source="{", type=TokenType.LCURLY)),
        TokensTransition.insert(3, Token(source="}", type=TokenType.RCURLY)),
    ]),
    ("()()", SourceTransition.insert(2, "{"), [
        TokensTransition.insert(2, Token(source="{", type=TokenType.LCURLY)),
        TokensTransition.insert(3, Token(source="}", type=TokenType.RCURLY)),
    ]),
    ("()}", SourceTransition.insert(0, "{"), [
        TokensTransition.insert(0, Token(source="{", type=TokenType.LCURLY)),
        TokensTransition.insert(3, Token(source="}", type=TokenType.RCURLY)),
    ]),

])
def test_generate_tokens_transition(source, source_transition, tokens_transition):
    state = state_from_source(source)
    result = generate_tokens_transition(state, source_transition)
    assert result == tokens_transition

# def test_generate_tokens_transition():
#     source = "}"
#     tokens = enhance(tokenise(source))
#     source_transition = SourceTransition.insert(0, "{")

#     tokens_transition = generate_tokens_transition(state, source_transition)

#     assert (
#         enchance(tokenise(apply_source_transition(source, source_transition))) ==
#         apply_tokens_transition(tokens, tokens_transition)
#     )
