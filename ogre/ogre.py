import dataclasses

def world(sample, objects):
    return World(
        sample,
        objects,
        objects_in_room=sample(objects, 2),
        obj_adjectives={},
        verb_adjectives={},
        last_verb=None
    )

@dataclasses.dataclass
class World:
    sample: object
    objects: object
    objects_in_room: object
    obj_adjectives: object
    verb_adjectives: object
    last_verb: str

    def player_says(self, player_message):
        if player_message == 'Hello':
            return self, "Hello"
        elif player_message == 'Look around':
            return self, self.see()
        elif not self.last_verb:
            verb, obj = player_message.split(" ")
            verb = verb.lower()
            if verb in self.verb_adjectives:
                obj_adjectives = self.obj_adjectives.copy()
                obj_adjectives[obj] = self.verb_adjectives[verb]
                return dataclasses.replace(self, obj_adjectives=obj_adjectives), ""
            else:
                return dataclasses.replace(
                    self,
                    last_verb=verb,
                ), f"What happens after you {verb} {obj}?"
        else:
            obj, adj = player_message.split(" ")
            obj_adjectives = self.obj_adjectives.copy()
            obj_adjectives[obj] = adj
            verb_adjectives = self.verb_adjectives.copy()
            verb_adjectives[self.last_verb] = adj
            world = dataclasses.replace(
                self,
                obj_adjectives=obj_adjectives,
                verb_adjectives=verb_adjectives,
                last_verb=None,
            )
            return world, world.see()

    def see(self):
        o1, o2 = [self.describe_obj(obj) for obj in self.objects_in_room]
        return f'You see a {o1} and a {o2}'

    def describe_obj(self, obj):
        adj = self.obj_adjectives.get(obj)
        if adj is None:
            return obj
        else:
            return f"{adj} {obj}"
