#!/usr/bin/env pytest

import pytest
import subprocess

def test_quit():
    kev = Kev()
    assert kev.command("QUIT") == [b"So long and thanks for all the fish.\n"]
    exit_code = kev.wait()
    assert exit_code == 0


def test_keys_request_on_empty_log_prints_ok():
    kev = Kev()
    assert kev.command("KEYS") == []
    kev.command("QUIT")
    kev.wait()

def test_put_prints_ok():
    kev = Kev()
    assert kev.command("PUT foo bar") == []
    assert kev.command("GET foo") == [b"bar\n"]
    assert kev.command("PUT foo baz") == []
    assert kev.command("GET foo") == [b"baz\n"]
    kev.command("QUIT")
    kev.wait()


def test_can_get_keys_other_than_most_recent():
    kev = Kev()
    assert kev.command("PUT foo bar") == []
    assert kev.command("PUT baz quux") == []
    assert kev.command("GET foo") == [b"bar\n"]
    kev.command("QUIT")
    kev.wait()

def test_returns_not_ok_for_non_existent_key():
    kev = Kev()
    assert kev.command("GET foo") == [b"NOT OK\n"]
    kev.command("QUIT")
    kev.wait()

def test_deleted_items_return_null():
    kev = Kev()
    kev.command("PUT foo bar")
    kev.command("DEL foo")
    assert kev.command("GET foo") == [b"NOT OK\n"]
    kev.command("QUIT")
    kev.wait()

def test_non_existent_command():
    kev = Kev()
    assert kev.command("RUBBISH") == [b"NOT OK\n"]
    kev.command("QUIT")
    kev.wait()

def test_keys_lists_them_all():
    kev = Kev()
    assert kev.command("PUT foo bar") == []
    assert kev.command("PUT baz quux") == []
    assert kev.command("KEYS") == [b"foo\n", b"baz\n"]
    kev.command("QUIT")
    kev.wait()

def test_keys_lists_them_all_once():
    kev = Kev()
    assert kev.command("PUT foo bar") == []
    assert kev.command("PUT foo bar") == []
    assert kev.command("PUT baz quux") == []
    assert kev.command("DEL baz") == []
    assert kev.command("KEYS") == [b"foo\n"]
    kev.command("QUIT")
    kev.wait()

class Kev(object):
    def __init__(self):
        self._process = subprocess.Popen(["./kev"], stdin=subprocess.PIPE, stdout=subprocess.PIPE, bufsize=1)

    def __read_until_ok(self):
        while True:
            line = self._process.stdout.readline()
            if line == b'OK\n':
                return
            elif line == b'NOT OK\n':
                yield line
                return

            yield line


    def command(self, value):
        self._process.stdin.write(value.encode("utf-8") + b"\n")
        self._process.stdin.flush()
        return list(self.__read_until_ok())

    def stdout_line(self):
        return self._process.stdout.readline()

    def wait(self):
        return self._process.wait()
