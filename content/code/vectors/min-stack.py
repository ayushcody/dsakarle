class MinStack:
    def __init__(self):
        self.items = []      # the stack: push_back and pop_back on a vector
        self.mins = []       # mins[k] is the smallest of items[0..k]

    def push(self, val):
        self.items.append(val)
        smallest = min(val, self.mins[-1]) if self.mins else val
        self.mins.append(smallest)

    def pop(self):
        self.items.pop()
        self.mins.pop()

    def top(self):
        return self.items[-1]

    def getMin(self):
        return self.mins[-1]
