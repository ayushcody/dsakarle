import random


class RandomizedSet:
    def __init__(self):
        self.items = []          # the values, packed with no gaps
        self.index_of = {}       # value -> its index in items

    def insert(self, val):
        if val in self.index_of:
            return False
        self.index_of[val] = len(self.items)
        self.items.append(val)
        return True

    def remove(self, val):
        if val not in self.index_of:
            return False
        i = self.index_of[val]
        last = self.items[-1]
        self.items[i] = last             # the last value fills the hole
        self.index_of[last] = i
        self.items.pop()                 # pop_back: O(1), nothing shifts
        del self.index_of[val]
        return True

    def getRandom(self):
        return random.choice(self.items)
