class MinStack:
    def __init__(self):
        self.stack = []  # each entry is (value, smallest value at or below it)

    def push(self, val):
        smallest = val if not self.stack else min(val, self.stack[-1][1])
        self.stack.append((val, smallest))

    def pop(self):
        self.stack.pop()

    def top(self):
        return self.stack[-1][0]

    def getMin(self):
        return self.stack[-1][1]
