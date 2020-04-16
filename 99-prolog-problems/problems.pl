my_last(X, [_|R]) :- my_last(X, R).
my_last(X, [X]).

my_penultimate(X, [_|R]) :- my_penultimate(X, R).
my_penultimate(X, [X,_]).

element_at(H, [H|_], 0).
element_at(X, [_|T], N) :- element_at(X, T, M), succ(M, N).

my_length(0, []).
my_length(L, [_|T]) :- my_length(M, T), succ(M, L).

my_reverse(R, L) :- my_reverse(R, L, []).

my_reverse(L, [], L).
my_reverse(M, [H|T], L) :- my_reverse(M, T, [H|L]).

palindrome(L) :- my_reverse(L, L).

palindrome2(L, L).
palindrome2([_|L], L).
palindrome2([H|T], L) :- palindrome2(T, [H|L]).

palindrome2(L) :- palindrome2(L, []).


my_flatten([], []).
my_flatten([H|T], X) :-
    is_list(H),
    my_flatten(H, FlatH),
    my_flatten(T, FlatT),
    append(FlatH, FlatT, X).
my_flatten([H|T], X) :-
    not(is_list(H)),
    my_flatten(T, FlatT),
    append([H], FlatT, X).
