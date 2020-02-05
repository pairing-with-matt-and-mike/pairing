def diff(exp, var):
    if exp == var:
        return 1
    if isinstance(exp, (int, str)):
        return 0
    if exp[0] == '+':
        return ('+', diff(exp[1], var), diff(exp[2], var))
    if exp[0] == '*':
        return ('+',
                ('*', diff(exp[1], var), exp[2]),
                ('*', exp[1], diff(exp[2], var)))
        return ('*', exp[1], 1)





def simplify(exp):
    if isinstance(exp, (int, str)):
        return exp

    op, left, right = exp

    left = simplify(left)
    right = simplify(right)

    if op == '+':
        if left == 0:
            return right
        if right == 0:
            return left
        if isinstance(left, int) and isinstance(right, int):
            return left + right
        if isinstance(left, int) or isinstance(right, int):
            return (op, left, right)
        if left == right and isinstance(left, str):
            return ('*', 2, left)
        if right[0] == '*' and isinstance(right[1], int) and left == right[2]:
            return ('*', right[1] + 1, left)
        if left[0] == '*' and isinstance(left[1], int) and right == left[2]:
            return ('*', left[1] + 1, right)
        if left[0] == '*' and right[0] == '*' and left[2] == right[2]:
            return ('*', left[1] + right[1], right[2])

    if op == '*':
        if left == 0 or right == 0:
            return 0
        if left == 1:
            return right
        if right == 1:
            return left
        if isinstance(left, int) and isinstance(right, int):
            return left * right

    return (op, left, right)

def test_diff_constant():
    res = diff(10, 'x')
    assert res == 0

def test_diff_sum():
    res = diff(('+', 20, 'x'), 'x')
    assert res == ('+', 0, 1)

def test_diff_different_variable():
    res = diff(('+', 20, 'x'), 'y')
    assert res == ('+', 0, 0)

def test_diff_different_variable2():
    res = diff(('*', 'a', 'x'), 'x')
    assert res == ('+', ('*', 0, 'x'), ('*', 'a', 1))

def test_diff_variable():
    res = diff(('+', 20, ('*', 10, 'x')), 'x')
    assert res == ('+', 0, ('+', ('*', 0, 'x'), ('*', 10, 1)))
    res = diff(('+', 20, ('*', 'x', 10)), 'x')
    assert res == ('+', 0, ('+', ('*', 1, 10), ('*', 'x', 0)))

def test_diff_square():
    res = simplify(diff(('*', 'x', 'x'), 'x'))
    assert res == ('*', 2, 'x')

def test_add_zero_simplifies_to_other_operand():
    res = simplify(('+', 0, 1))
    assert res == 1
    res = simplify(('+', 1, 0))
    assert res == 1
    res = simplify(('+', 'x', 0))
    assert res == 'x'

def test_add_operands_are_simplified():
    res = simplify(('+', ('+', 0, 'x'), ('+', 0, 'y')))
    assert res == ('+', 'x', 'y')
    res = simplify(('+', ('+', 0, 'x'), ('+', 0, 0)))
    assert res == 'x'

def test_multiply_zero_simplifies_to_zero():
    res = simplify(('*', 0, 'x'))
    assert res == 0
    res = simplify(('*', 1, 0))
    assert res == 0

def test_multiply_one_simplifies_to_other_operand():
    res = simplify(('*', 1, 'x'))
    assert res == 'x'
    res = simplify(('*', 1, 1))
    assert res == 1

def test_constant_folding():
    res = simplify(('+', 3, 2))
    assert res == 5
    res = simplify(('*', 3, 2))
    assert res == 6

def test_variable_folding():
    res = simplify(('+', 'x', 'x'))
    assert res == ('*', 2, 'x')
    res = simplify(('+', 'x', ('+', 'x', 'x')))
    assert res == ('*', 3, 'x')
    res = simplify(('+', ('+', 'x', 'x'), 'x'))
    assert res == ('*', 3, 'x')
    res = simplify(('+', ('+', 'x', 'x'), ('+', 'x', 'x')))
    assert res == ('*', 4, 'x')
    res = simplify(('+', ('+', 2, 'x'), ('+', 2, 'x')))
    assert res == ('+', ('+', 2, 'x'), ('+', 2, 'x'))
    # TODO:
    # res = simplify(('*', 2, ('*', 2, 'x')))
    # assert res == ('*', 4, 'x')
