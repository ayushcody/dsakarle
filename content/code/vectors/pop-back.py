class Vector:
    def __init__(self, data, size):
        self.data = data                            # @init
        self.capacity = len(data)                   # @init
        self.size = size                            # @init
        self.copies = 0                             # @init

    # The caller makes sure size > 0 before popping.
    def pop_back(self):
        self.size -= 1                              # @pop
        if self.size * 4 <= self.capacity and self.capacity >= 4:   # @check
            smaller = [0] * (self.capacity // 2)    # @shrink
            for i in range(self.size):
                smaller[i] = self.data[i]           # @copy
                self.copies += 1                    # @copy
            self.data = smaller                     # @swap
            self.capacity = len(smaller)            # @swap

    def pop_many(self, pops):
        for _ in range(pops):
            self.pop_back()
        return self.copies                          # @done
