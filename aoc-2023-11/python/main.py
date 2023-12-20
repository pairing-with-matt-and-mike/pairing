import itertools


def solve(universe):
    expanded_universe = expand(universe)

    galaxies = find_galaxies(expanded_universe)

    return total_distance(galaxies)


def expand(universe):
    return transpose(expand_rows(transpose(expand_rows(universe.splitlines()))))


def expand_rows(universe):
    return [
        expanded_row
        for row in universe
        for expanded_row in (
                [row, row]
                if all(cell == "." for cell in row)
                else [row]
        )
    ]


def transpose(universe):
    transposed = [
        ""
        for cell in universe[0]
    ]

    for row in universe:
        for column_index, cell in enumerate(row):
            transposed[column_index] += cell

    return transposed


def find_galaxies(universe):
    return [
        (x, y)
        for y, row in enumerate(universe)
        for x, cell in enumerate(row)
        if cell == "#"
    ]


def total_distance(galaxies):
    return sum(
        distance(left, right)
        for left, right in itertools.combinations(galaxies, 2)
    )


def distance(left, right):
    (x1, y1) = left
    (x2, y2) = right

    return abs(y2 - y1) + abs(x2 - x1)


print(solve("""\
...#......
.......#..
#.........
..........
......#...
.#........
.........#
..........
.......#..
#...#....."""))
