#!/usr/bin/env pytest

import pytest
import subprocess

def test_quit():
    kev = Kev()
    assert kev.command("QUIT") == [b"So long and thanks for all the fish."]
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
    assert kev.command("GET foo") == [b"bar"]
    assert kev.command("PUT foo baz") == []
    assert kev.command("GET foo") == [b"baz"]
    kev.command("QUIT")
    kev.wait()

def test_can_get_keys_other_than_most_recent():
    kev = Kev()
    assert kev.command("PUT foo bar") == []
    assert kev.command("PUT baz quux") == []
    assert kev.command("GET foo") == [b"bar"]
    kev.command("QUIT")
    kev.wait()

def test_returns_not_ok_for_non_existent_key():
    kev = Kev()
    assert kev.command("GET foo") == [b"NOT OK"]
    kev.command("QUIT")
    kev.wait()

@pytest.mark.parametrize("command", (
    "GET ",
    "GET",
))
def test_get_command_without_key_returns_not_ok(command):
    kev = Kev()
    assert kev.command(command) == [b"NOT OK"]
    kev.command("QUIT")
    kev.wait()

@pytest.mark.parametrize("command", (
    "PUT ",
    "PUT k ",
    "PUT k",
    "PUT",
))
def test_put_command_with_missing_arguments_returns_not_ok(command):
    kev = Kev()
    assert kev.command(command) == [b"NOT OK"]
    assert kev.command("KEYS") == []
    kev.command("QUIT")
    kev.wait()

def test_del_command_without_key_returns_not_ok():
    kev = Kev()
    assert kev.command("PUT foo bar") == []
    assert kev.command("DEL") == [b"NOT OK"]
    assert kev.command("DEL ") == [b"NOT OK"]
    assert kev.command("GET foo") == [b"bar"]
    kev.command("QUIT")
    kev.wait()

def test_deleted_items_return_null():
    kev = Kev()
    kev.command("PUT foo bar")
    kev.command("DEL foo")
    assert kev.command("GET foo") == [b"NOT OK"]
    kev.command("QUIT")
    kev.wait()

def test_non_existent_command():
    kev = Kev()
    assert kev.command("RUBBISH") == [b"NOT OK"]
    kev.command("QUIT")
    kev.wait()

def test_keys_lists_them_all():
    kev = Kev()
    assert kev.command("PUT foo bar") == []
    assert kev.command("PUT baz quux") == []
    assert kev.command("KEYS") == [b"foo", b"baz"]
    kev.command("QUIT")
    kev.wait()

def test_keys_lists_them_all_once():
    kev = Kev()
    assert kev.command("PUT foo bar") == []
    assert kev.command("PUT foo bar") == []
    assert kev.command("PUT baz quux") == []
    assert kev.command("DEL baz") == []
    assert kev.command("KEYS") == [b"foo"]
    kev.command("QUIT")
    kev.wait()

def test_persistence(tmp_path):
    data_path = str(tmp_path / "data.kev")
    kev = Kev(data_path)
    assert kev.command("PUT foo bar") == []
    kev.command("QUIT")
    kev.wait()
    kev = Kev(data_path)
    assert kev.command("GET foo") == [b"bar"]
    kev.command("QUIT")
    kev.wait()

def test_persistence_del(tmp_path):
    data_path = str(tmp_path / "data.kev")
    kev = Kev(data_path)
    assert kev.command("PUT foo bar") == []
    kev.command("QUIT")
    kev.wait()
    kev = Kev(data_path)
    assert kev.command("DEL foo") == []
    kev.command("QUIT")
    kev.wait()
    kev = Kev(data_path)
    assert kev.command("GET foo") == [b"NOT OK"]
    kev.command("QUIT")
    kev.wait()

class Kev(object):
    def __init__(self, data_path=None):
        command = ["./kev"]
        if data_path is not None:
            command.append(data_path)
        self._process = subprocess.Popen(command,
                                         stdin=subprocess.PIPE,
                                         stdout=subprocess.PIPE,
                                         bufsize=1)

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
        return [x.rstrip(b'\n') for x in self.__read_until_ok()]

    def stdout_line(self):
        return self._process.stdout.readline()

    def wait(self):
        return self._process.wait()
