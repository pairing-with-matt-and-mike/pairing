import pytest
import random


def test_initialise_population():
    generation = initialise_population(5)

    assert len(generation) == 5
    assert all([len(genome) == 1 for genome in generation])
    assert all([
        gene in ("w", "a", "s", "d")
        for genome in generation
        for gene in genome
    ])

@pytest.mark.parametrize("end, good_genome, bad_genome", (
    (( 0,  1), "w", "s"),
    ((-1,  0), "a", "w"),
    (( 0, -1), "s", "w"),
    (( 1,  0), "d", "w"),
    (( 0,  2), "ww", "w"),
    (( 0,  2), "w", "")
))
def test_genomes_closer_to_goal_are_fitter(end, good_genome, bad_genome):
    maze = {
        "start": (0, 0),
        "end": end,
    }
    assert fitness(maze, good_genome) < fitness(maze, bad_genome)

def move(pos, gene):
    diff_x, diff_y = {
        "w": ( 0,  1),
        "a": (-1,  0),
        "s": ( 0, -1),
        "d": ( 1,  0),
    }[gene]
    x, y = pos
    return (x + diff_x, y + diff_y)

def distance(pos_a, pos_b):
    ax, ay = pos_a
    bx, by = pos_b
    return abs(ay - by) + abs(ax - bx)

def fitness(maze, genome):
    pos = maze["start"]
    for gene in genome:
        pos = move(pos, gene)

    return (distance(maze["end"], pos), len(genome))

def mutate(genome):
    return genome + random.choice("wasd")

def initialise_population(n):
    return [mutate("") for _ in range(n)]

def test_select():
    maze = {
        "start": (0, 0),
        "end": (0, 1),
    }
    assert select(maze, ["a", "w"], 1) == ["w"]

def select(maze, generation, n):
    return sorted(generation, key = lambda genome: fitness(maze, genome))[:n]

def next_generation(maze, generation):
    parents = select(maze, generation, 5)
    random.shuffle(parents)
    x = list(frozenset([
        genome
        for parent in parents
        for genome in (parent, mutate(parent), mutate(parent), mutate(parent))
    ]))
    random.shuffle(x)
    return x

def main():
    number_of_generations = 5

    generation = initialise_population(10)
    maze = {
        "start": (0, 0),
        "end": (10, 10),
    }
    for i in range(number_of_generations):
        generation = next_generation(maze, generation)
        print("=== Gen {} ===".format(i))
        for genome in select(maze, generation, len(generation)):
            print(genome)

    print("=== BEST ===")
    for genome in select(maze, generation, 10):
        print(genome)
    # for a generation
    # - run the fitness function, if great then done
    # - pick best
    # - mutate and breed


if __name__ == "__main__":
    main()
