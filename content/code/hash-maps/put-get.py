class HashTable:
    # Keys are non-negative ints, so key % m is always a valid bucket.
    def __init__(self, m=5):
        self.m = m                                  # @init
        self.buckets = [[] for _ in range(m)]       # @init

    def put(self, key, value):
        chain = self.buckets[key % self.m]          # @hash
        for entry in chain:
            if entry[0] == key:                     # @walk
                entry[1] = value                    # @update
                return
        chain.append([key, value])                  # @insert

    def get(self, key):
        chain = self.buckets[key % self.m]          # @hash
        for entry in chain:
            if entry[0] == key:                     # @walk
                return entry[1]                     # @found
        return None                                 # @missing
