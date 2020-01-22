import collections

parsers = {
    1: ("add", 3),
    2: ("mul", 3),
    3: ("read", 1),
    99: ("halt", 0),
}

def disassemble_one(program, i):
    try:
        op, arg_count = parsers[program[i]]
    except KeyError:
        return (("data", i, program[i:]), len(program))

    args = tuple(
        ("addr", program[i + j + 1])
        for j in range(0, arg_count)
    )

    return (
        (op, ) + args,
        i + 1 + arg_count
    )

def disassemble(program):
    instructions = []
    i = 0
    while i < len(program):
        instruction, i = disassemble_one(program, i)
        instructions.append(instruction)
    return instructions

def lookup():
    counter = 96
    def new_label():
        nonlocal counter
        counter += 1
        return chr(counter)
    return new_label

def decompile(instructions):
    renv = collections.defaultdict(lookup())

    data_index, data = None, None
    for instruction in instructions:
        if instruction[0] == "data":
            data_index, data = instruction[1:]

    program = ("do", [])
    for instruction in instructions:
        if instruction[0] == "halt":
            return ({v: data[k - data_index] for k, v in renv.items()}, program)
        else:
            node = (
                instruction[0],
                renv[instruction[1][1]],
                renv[instruction[2][1]]
            )
            node = (
                "assign",
                renv[instruction[3][1]],
                node
            )
            program[1].append(node)

def test_opcode_1_is_disassembled_to_add():
    program = [1, 9, 10, 3]

    result = disassemble(program)

    assert result == [
        ("add", ("addr", 9), ("addr", 10), ("addr", 3))
    ]

def test_opcode_2_is_disassembled_to_mul():
    program = [2, 3, 11, 0]

    result = disassemble(program)

    assert result == [
        ("mul", ("addr", 3), ("addr", 11), ("addr", 0))
    ]

# Opcode 3 takes a single integer as input and saves it to the position given by its only parameter. For example, the instruction 3,50 would take an input value and store it at address 50.
# Opcode 4 outputs the value of its only parameter. For example, the instruction 4,50 would output the value at address 50.

def test_opcode_3_is_disassembled_to_read():
    program = [3, 1]

    result = disassemble(program)

    assert result == [
        ("read", ("addr", 1))
    ]

def test_opcode_99_is_disassembled_to_halt():
    program = [99]

    result = disassemble(program)

    assert result == [
        ("halt",)
    ]

#1002,4,3,4,33.

def test_can_disassemble_multiple_instructions():
    program = [1, 9, 10, 3, 2, 3, 11, 0, 99]

    result = disassemble(program)

    assert result == [
        ("add", ("addr", 9), ("addr", 10), ("addr", 3)),
        ("mul", ("addr", 3), ("addr", 11), ("addr", 0)),
        ("halt",),
    ]

def test_trailing_data():
    program = [99, 30, 40]

    result = disassemble(program)

    assert result == [
        ("halt",),
        ("data", 1, [30, 40]),
    ]

def test_can_disassemble_day_2():
    program = [1, 9, 10, 3, 2, 3, 11, 0, 99, 30, 40, 50]

    result = disassemble(program)

    assert result == [
        ("add", ("addr", 9), ("addr", 10), ("addr", 3)),
        ("mul", ("addr", 3), ("addr", 11), ("addr", 0)),
        ("halt",),
        ("data", 9, [30, 40, 50])
    ]

def test_can_decompile_add_and_halt():
    program = [1, 5, 6, 7, 99, 30, 40, 0]

    result = decompile(disassemble(program))

    assert result == (
        {"a": 30, "b": 40, "c": 0},
        ("do", [("assign", "c", ("add", "a", "b"))])
    )

def test_can_decompile_day_2():
    program = [1, 9, 10, 11, 2, 11, 12, 13, 99, 30, 40, 0, 50, 0]

    result = decompile(disassemble(program))

    assert result == (
        {"a": 30, "b": 40, "c": 0, "d": 50, "e": 0},
        ("do", [
            ("assign", "c", ("add", "a", "b")),
            ("assign", "e", ("mul", "c", "d")),
        ])
    )
