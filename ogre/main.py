#!/usr/bin/env python3

import ogre
import random

if __name__ == '__main__':
    world = ogre.world(sample=random.sample, objects=('chair', 'hat', 'carrot', 'portal', 'sword', 'ogre'))
    print('## Ogre ##')
    while True:
        print('> ', end = '')
        world, output = world.player_says(input())
        print(output)
