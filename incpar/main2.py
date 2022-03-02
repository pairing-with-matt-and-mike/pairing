from __future__ import annotations

import dataclasses
import enum

class TokenType(enum.Enum):
    LPAREN=enum.auto()
    RPAREN=enum.auto()

@dataclasses.dataclass(frozen=True)
class Token:
    source: str
    type: TokenType

    @staticmethod
    def rparen(*, source):
        return Token(source=source, type=TokenType.RPAREN)


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

def test_can_parse_open_paren():
    source = "("
    result = enhance(tokenise(source))
    assert result == [
        Token(source="(", type=TokenType.LPAREN),
        Token(source=")", type=TokenType.RPAREN)
    ]

def test_can_parse_double_open_parens():
    source = "(("
    result = enhance(tokenise(source))
    assert result == [
        Token(source="(", type=TokenType.LPAREN),
        Token(source="(", type=TokenType.LPAREN),
        Token(source=")", type=TokenType.RPAREN),
        Token(source=")", type=TokenType.RPAREN)
    ]

def test_can_parse_close_paren():
    source = ")"
    result = enhance(tokenise(source))
    assert result == []

def test_can_parse_close_paren_then_open_paren():
    source = ")("
    result = enhance(tokenise(source))
    assert result == [
        Token(source="(", type=TokenType.LPAREN),
        Token(source=")", type=TokenType.RPAREN)
    ]


def enhance(tokens):
    depth = 0
    result = []
    for token in tokens:
        if token.type == TokenType.LPAREN:
            depth += 1
            result += [token]
        elif token.type == TokenType.RPAREN and depth != 0:
            depth -= 1
            result += [token]

    if depth >= 1:
        return result + [Token.rparen(source=")")] * depth
    else:
        return result


def tokenise(source):
    if len(source) == 0:
        return []

    c = source[0]
    cs = source[1:]

    if c == "(":
        return [Token(c, TokenType.LPAREN), *tokenise(cs)]
    elif c == ")":
        return [Token(c, TokenType.RPAREN), *tokenise(cs)]
