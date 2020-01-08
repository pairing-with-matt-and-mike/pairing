input = """\
....#
#..#.
#..##
..#..
#....\
"""

layout = [
    list(row)
    for row in input.split("\n")
]

def neighbours(x, y):
    for dx, dy in ([-1, 0], [1, 0], [0, -1] , [0, 1]):
        x1 = x + dx
        y1 = y + dy
        if 0 <= x1 < 5 and 0 <= y1 < 5:
            yield (x1, y1)

def neighbouring_bugs(layout, x, y):
    count = 0
    for x2, y2 in neighbours(x, y):
        if layout[y2][x2] == "#":
            count += 1

    return count

def next_state(layout, x, y):
    cell = layout[y][x]
    alive = cell == "#"
    ns = neighbouring_bugs(layout, x, y)
    if alive and ns != 1:
        return "."
    if not alive and ns in [1, 2]:
        return "#"
    return cell

def next_layout(layout):
    return [
        [
            next_state(layout, x, y)
            for x in range(0, 5)
        ]
        for y in range(0, 5)
    ]

def format_layout(layout):
    return "\n".join("".join(row) for row in layout) + "\n"

def print_layout(layout):
    print(format_layout(layout))

layouts = [layout]

while True:
    # print_layout(layout)
    layout = next_layout(layout)
    if layout in layouts:
        print_layout(layout)
        print(len(layouts))
        break 
    layouts.append(layout)

def biodiversity(layout):
    cells = [
        cell
        for row in layout
        for cell in row
    ]

    biodiversity = 0
    for index, cell in enumerate(cells):
        if cell == "#":
            biodiversity += 2 ** index

    return biodiversity

print(biodiversity(layout))
