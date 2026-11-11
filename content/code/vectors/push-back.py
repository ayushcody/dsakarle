class Vector:
    def __init__(self, capacity):
        self.data = [0] * capacity                  # @init
        self.capacity = capacity                    # @init
        self.size = 0                               # @init
        self.copies = 0                             # @init

    def push_back(self, value):
        if self.size == self.capacity:              # @room
            bigger = [0] * max(1, 2 * self.capacity)    # @grow
            for i in range(self.size):
                bigger[i] = self.data[i]            # @copy
                self.copies += 1                    # @copy
            self.data = bigger                      # @swap
            self.capacity = len(bigger)             # @swap
        self.data[self.size] = value                # @write
        self.size += 1                              # @write

    def push_all(self, values):
        for value in values:
            self.push_back(value)
        return self.copies                          # @done
