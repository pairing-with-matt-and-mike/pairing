def make_change(amount, coins):
    if coins == [] or amount < 0:
        return []

    if amount == 0:
        return [{}]

    first_coin = coins[0]

    return [
        _add_coin(result, first_coin)
        for result in make_change(amount - first_coin, coins)
    ] + make_change(amount, coins[1:])

def _add_coin(result, coin):
    result = result.copy()
    if coin not in result:
        result[coin] = 0
    result[coin] += 1
    return result

def test_there_is_one_way_to_make_zero():
    result = make_change(0, [1])
    assert result == [{}]

def test_there_is_one_way_to_make_one_with_one():
    result = make_change(1, [1])
    assert result == [{1: 1}]

def test_there_is_one_way_to_make_ten_with_ten_ones():
    result = make_change(10, [1])
    assert result == [{1: 10}]

def test_there_is_two_ways_to_make_two_with_ones_and_twos():
    result = make_change(2, [1, 2])
    assert result == [{1: 2}, {2: 1}]

def test_100():
    result = make_change(100, list(reversed([1, 5, 10, 25, 50])))
    assert len(result) == 292
