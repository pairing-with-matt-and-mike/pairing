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
class Token:
    source: str
    type: TokenType

    @staticmethod
    def rparen(*, source):
        return Token(source=source, type=TokenType.RPAREN)

    @staticmethod
    def rcurly(*, source):
        return Token(source=source, type=TokenType.RCURLY)


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
