class MyCircularQueue:
    def __init__(self, k):
        self.capacity = k                               # @init
        self.buf = [0] * k                              # @init
        self.front = 0                                  # @init
        self.back = k - 1                               # @init
        self.size = 0                                   # @init

    def enQueue(self, value):
        if self.size == self.capacity:                  # @full
            return False                                # @full
        self.back = (self.back + 1) % self.capacity     # @enqueue
        self.buf[self.back] = value                     # @enqueue
        self.size += 1                                  # @enqueue
        return True                                     # @enqueue

    def deQueue(self):
        if self.size == 0:                              # @empty
            return False                                # @empty
        self.front = (self.front + 1) % self.capacity   # @dequeue
        self.size -= 1                                  # @dequeue
        return True                                     # @dequeue

    def Front(self):
        return -1 if self.size == 0 else self.buf[self.front]

    def Rear(self):
        return -1 if self.size == 0 else self.buf[self.back]

    def isEmpty(self):
        return self.size == 0

    def isFull(self):
        return self.size == self.capacity
