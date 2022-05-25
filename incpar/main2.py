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

class TokensTransition:
    @staticmethod
    def insert(index, token):
        return TokensTransitionInsert(index, token)

    @staticmethod
    def change_origin(index, new_origin):
        return TokensTransitionChangeOrigin(index, new_origin)

@dataclasses.dataclass(frozen=True)
class TokensTransitionInsert:
    index: int
    token: Token


@dataclasses.dataclass(frozen=True)
class TokensTransitionChangeOrigin:
    index: int
    new_origin: TokenOrigin


class TokenOrigin(enum.Enum):
    SYNTHETIC = enum.auto()
    IGNORED = enum.auto()
    REAL = enum.auto()


@dataclasses.dataclass(frozen=True)
class Token:
    source: str
    type: TokenType
    origin: TokenOrigin = TokenOrigin.REAL

    @staticmethod
    def rparen(*, source, origin=TokenOrigin.REAL):
        return Token(source=source, type=TokenType.RPAREN, origin=origin)

    @staticmethod
    def lcurly(*, source):
        return Token(source=source, type=TokenType.LCURLY)

    @staticmethod
    def rcurly(*, source, origin=TokenOrigin.REAL):
        return Token(source=source, type=TokenType.RCURLY, origin=origin)

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
        ignored_token = next(
            iter(filter(
                lambda token: token[1].origin == TokenOrigin.IGNORED,
                enumerate(state.tokens),
            )),
            None,
        )

        if ignored_token is None:
            closing_token = TokensTransition.insert(source_transition.index + 1, Token.rcurly(source="}"))
        else:
            closing_token = TokensTransition.change_origin(
                ignored_token[0] + 1,
                TokenOrigin.REAL,
            )

        return [
            TokensTransition.insert(source_transition.index, Token.lcurly(source="{")),
            closing_token,
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
        else:
            result += [dataclasses.replace(token, origin=TokenOrigin.IGNORED)]

    return result + [
        _token_type_to_closing_token[token_type]
        for token_type in reversed(stack)
    ]

_token_type_to_closing_token = {
    BracketType.PAREN: Token.rparen(source=")", origin=TokenOrigin.SYNTHETIC),
    BracketType.CURLY: Token.rcurly(source="}", origin=TokenOrigin.SYNTHETIC),
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

def overwrite_origin(tokens):
    return [dataclasses.replace(t, origin=TokenOrigin.REAL) for t in tokens]

def remove_ignored(tokens):
    return [t for t in tokens if t.origin != TokenOrigin.IGNORED]

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
    assert overwrite_origin(remove_ignored(enhance(tokenise(left)))) == enhance(tokenise(right))

def test_enhance_includes_synthetic_tokens():
    source = "("

    result = enhance(tokenise(source))

    assert result == [
        Token(source="(", type=TokenType.LPAREN, origin=TokenOrigin.REAL),
        Token(source=")", type=TokenType.RPAREN, origin=TokenOrigin.SYNTHETIC),
    ]

def test_enhance_includes_synthetic_2_tokens():
    source = "{"

    result = enhance(tokenise(source))

    assert result == [
        Token(source="{", type=TokenType.LCURLY, origin=TokenOrigin.REAL),
        Token(source="}", type=TokenType.RCURLY, origin=TokenOrigin.SYNTHETIC),
    ]

def test_enhance_includes_synthetic_3_tokens():
    source = "{)"

    result = enhance(tokenise(source))

    assert result == [
        Token(source="{", type=TokenType.LCURLY, origin=TokenOrigin.REAL),
        Token(source="}", type=TokenType.RCURLY, origin=TokenOrigin.SYNTHETIC),
        Token(source=")", type=TokenType.RPAREN, origin=TokenOrigin.IGNORED),
    ]

def test_can_parse_curly_braces():
    source = "{}"
    result = enhance(tokenise(source))
    assert result == [
        Token(source="{", type=TokenType.LCURLY),
        Token(source="}", type=TokenType.RCURLY),
    ]

@pytest.mark.parametrize("source, source_transition, tokens_transition", [
    ("{", SourceTransition.insert(1, "}"), [
        # TokensTransition.change_origin(1, TokenOrigin.REAL),
    ]),
    ("}", SourceTransition.insert(0, "{"), [
        TokensTransition.insert(0, Token(source="{", type=TokenType.LCURLY)),
        TokensTransition.change_origin(1, TokenOrigin.REAL),
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
        TokensTransition.change_origin(3, TokenOrigin.REAL),
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
