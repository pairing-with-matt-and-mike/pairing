from __future__ import annotations

import dataclasses
import re
from typing import List


@dataclasses.dataclass(frozen=True)
class FunNode:
    name: str
    body: List[FunNode] = dataclasses.field(default_factory=list)
    errors: List[str] = dataclasses.field(default_factory=list)


def test_can_parse_empty_function_1():
    source = "fun x() { }"
    result = parse(source)
    assert result == FunNode(name="x", body=[])

def test_can_parse_empty_function_2():
    source = "fun y() { }"
    result = parse(source)
    assert result == FunNode(name="y", body=[])

def test_can_parse_nested_function():
    source = "fun y() { fun z() { } }"
    result = parse(source)
    assert result == FunNode(name="y", body=[FunNode(name="z")])

def test_can_parse_multiple_functions():
    source = "fun x() { fun y() { } fun z() { }  }"
    result = parse(source)
    assert result == FunNode(name="x", body=[FunNode(name="y"), FunNode(name="z")])

def test_can_parse_fun_missing_last_paren():
    source = "fun x() {"
    result = parse(source)
    assert result == FunNode(name="x", errors=["expected }"])

def test_can_parse_fun_missing_first_paren():
    source = "fun x() }"
    result = parse(source)
    assert result == FunNode(name="x", errors=["expected {"])

def test_can_parse_funk():
    source = "funk x() { }"
    result = parse(source)
    assert result == FunNode(
        name="x",
        errors=["expected fun"],
    )

# def test_can_parse_fun_in_funk():
#     source = "funk x() { fun y() { } }"
#     result = parse(source)
#     assert result == FailNode(body=[FunNode(name="y")])

def test_can_parse_inner_fun_of_invalid_fun():
    source = "fun x y() { fun z() { } }"
    result = parse(source)
    assert result == FunNode(name="x", body=[FunNode(name="z")], errors=["expected ("])

def parse(source):
    tokens = tokenize(source)
    print(tokens)
    reader = TokenReader(tokens)
    return parse_fun(reader)

def parse_fun(reader):
    errors = []
    reader.expect("fun", errors=errors)
    name = reader.read()
    reader.skip_until("(", errors=errors)
    reader.skip(")", errors=errors)
    reader.skip("{", errors=errors)
    body = parse_funs(reader)
    reader.skip("}", errors=errors)
    return FunNode(name=name, body=body, errors=errors)

def parse_funs(reader):
    funs = []

    while reader.is_next("fun"):
        funs.append(parse_fun(reader))

    return funs

class TokenReader:
    def __init__(self, tokens):
        self._tokens = tokens
        self._index = 0

    def expect(self, expected, errors):
        if expected != self._token():
            errors.append(f"expected {expected}")
        self._index += 1

    def skip(self, expected, errors):
        if expected != self._token():
            errors.append(f"expected {expected}")
        else:
            self._index += 1

    def skip_until(self, expected, errors):
        is_next = self.is_next(expected)

        while True:
            token = self._token()
            if token is None:
                return
            self._index += 1
            if expected == token:
                return
            else:
                errors.append(f"expected {expected}")


    def read(self):
        value = self._token()
        self._index += 1
        return value

    def is_next(self, value):
        return self._token() == value

    def _token(self):
        if self._index < len(self._tokens):
            return self._tokens[self._index]
        else:
            return None

def tokenize(source):
    return list(filter(None, map(lambda x: x.strip(), re.split(r"(\b|\{|\(|\)|\})", source))))
