import unittest
import ogre

class TestOgre(unittest.TestCase):

    def test_say_hello(self):
        world = ogre.world(
            sample=lambda xs, n: xs[0:n],
            objects=()
        )
        world, output = world.player_says('Hello')
        self.assertEquals(output, 'Hello')

    def test_rooms_start_with_two_items(self):
        world = ogre.world(
            sample=lambda xs, n: xs[0:n],
            objects=("chair", "table")
        )
        world, output = world.player_says('Look around')
        self.assertEquals(output, 'You see a chair and a table')

    def test_rooms_start_with_three_items(self):
        world = ogre.world(
            sample=lambda xs, n: xs[0:n],
            objects=("armchair", "lamp", "table")
        )
        world, output = world.player_says('Look around')
        self.assertEquals(output, 'You see a armchair and a lamp')

    def test_rooms_start_with_three_items(self):
        world = ogre.world(
            sample=lambda xs, n: xs[0:n],
            objects=("armchair", "lamp", "table")
        )
        world, output = world.player_says('Look around')
        self.assertEquals(output, 'You see a armchair and a lamp')
        world, output = world.player_says('Throw lamp')
        self.assertEquals(output, 'What happens after you throw lamp?')
        world, output = world.player_says('lamp broken')
        world, output = world.player_says('Look around')
        self.assertEquals(output, 'You see a armchair and a broken lamp')
        world, output = world.player_says('Throw armchair')
        world, output = world.player_says('Look around')
        self.assertEquals(output, 'You see a broken armchair and a broken lamp')
        #world, output = world.player_says('no')
        #self.assertEquals(output, 'What happens after you throw armchair?')

if __name__ == '__main__':
    unittest.main()
