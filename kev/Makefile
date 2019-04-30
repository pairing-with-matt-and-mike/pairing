.PHONY: test

CFLAGS=-Wall -g
CC=gcc

test: kev
	./tests.py -s -v

kev: main.c
	$(CC) $(CFLAGS) $^ -o $@
