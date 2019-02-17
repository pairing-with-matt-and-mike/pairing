
toy_time(buzz,   5).
toy_time(woody, 10).
toy_time(rex,   20).
toy_time(hamm,  25).

move2(Before, After, Time, Move) :-
    Before = (BeforeLeft, BeforeRight, left),
    select(A, BeforeLeft, X),
    select(B, X, AfterLeft),
    After = (AfterLeft, [A,B|BeforeRight], right),
    Move = (right, A, B),
    toy_time(A, TimeA),
    toy_time(B, TimeB),
    Time is max(TimeA, TimeB).

move2(Before, After, Time, Move) :-
    Before = (BeforeLeft, BeforeRight, right),
    select(A, BeforeRight, AfterRight),
    After = ([A|BeforeLeft], AfterRight, left),
    Move = (left, A),
    toy_time(A, Time).

% solve([buzz, woody, rex, hamm], 60, X)
solve(Toys, MaxTime, Moves) :-
    solve2((Toys, [], left), ([], ToysEnd, right), MaxTime, Moves),
    permutation(Toys, ToysEnd).

solve2(Start, End, MaxTime, [Move|Moves]) :-
    MaxTime >= 0,
    move2(Start, Next, Time0, Move),
    NewMaxTime is MaxTime - Time0,
    solve2(Next, End, NewMaxTime, Moves).

solve2(X, X, MaxTime, []) :-
    MaxTime >= 0.
