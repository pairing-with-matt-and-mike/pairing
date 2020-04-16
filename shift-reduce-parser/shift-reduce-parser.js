/*
 	Action Table                	        Goto Table
 	ID	':='	'+'	'-'	<EOF>	stmt	expr

*/

var actions  = [
    [shift(1),  null,      null,       null,      null],
    [null,      shift(3),  null,       null,      null],
    [null,      null,      null,       null,      accept()],
    [shift(5),  null,      null,       null,      null],
    [accept(),  accept(),  accept(),   accept(),  accept()],
    [reduce(4), reduce(4), reduce(4),  reduce(4), reduce(4)],
    [reduce(1), reduce(1), shift(7),   shift(8),  reduce(1)],
    [shift(9),  null,      null,       null,      null],
    [shift(10), null,      null,       null,      null],
    [reduce(2), reduce(2), reduce(2),  reduce(2), reduce(2)],
    [reduce(3), reduce(3), reduce(3),  reduce(3), reduce(3)]
];

var gotos = {
    0: {'stmt': 2},
    3: {'expr': 6}
};

var tokens = {
    "ID"  : 0,
    ":="  : 1,
    "+"   : 2,
    "-"   : 3,
    "EOF" : 4
};

var rules = [
    [],
    [3, 'stmt'],
    [3, 'expr'],
    [3, 'expr'],
    [1, 'expr']
];


var buffer = ["ID", ":=", "ID", "+", "ID", "-", "ID", "EOF"];

var stack = [["$", 0]];

var done = false;

while (!done) {
    var state = stack[stack.length - 1][1];
    var lookahead = buffer[0];
    actions[state][tokens[lookahead]](stack, buffer);
    console.log(JSON.stringify(buffer));
    console.log(JSON.stringify(stack));
}

function shift(state) {
    return function (stack, buffer) {
        stack.push([buffer.shift(), state]);
    };
}

function accept() {
    return function() {
        done = true;
    };
}


function reduce(ruleIndex) {
    return function (stack, buffer) {
        var rule = rules[ruleIndex];
        var args = [];
        for (var i = 0; i < rule[0]; i++) {
            args.push(stack.pop());
        }
        var state = stack[stack.length - 1][1];
        stack.push([rule[1], gotos[state][rule[1]], args]);
    };
}

// actions[0][]



// [["$",0],["stmt",2,[["expr",6,[["ID",10],["-",8],["expr",6,[["ID",9],["+",7],["expr",6,[["ID",5]]]]]]],[":=",3],["ID",1]]]]
