class CircularQueue:
    def __init__(self, capacity):
        self.capacity = capacity                        # @init
        self.buf = [None] * capacity                    # @init
        self.front = 0                                  # @init
        self.back = capacity - 1                        # @init
        self.size = 0                                   # @init

    def enqueue(self, x):
        if self.size == self.capacity:                  # @full
            return False                                # @full
        self.back = (self.back + 1) % self.capacity     # @enqueue
        self.buf[self.back] = x                         # @enqueue
        self.size += 1                                  # @enqueue
        return True                                     # @enqueue

    def dequeue(self):
        if self.size == 0:                              # @empty
            return None                                 # @empty
        x = self.buf[self.front]                        # @dequeue
        self.front = (self.front + 1) % self.capacity   # @dequeue
        self.size -= 1                                  # @dequeue
        return x                                        # @dequeue
