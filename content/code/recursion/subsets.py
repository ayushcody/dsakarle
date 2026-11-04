def subsets(nums, limit):
    res = []                                # @init
    path = []                               # @init

    def explore(i):
        if i == len(nums):                  # @found
            res.append(path[:])             # @found
            return                          # @found
        if len(path) < limit:               # @prune
            path.append(nums[i])            # @choose
            explore(i + 1)                  # @explore
            path.pop()                      # @unchoose
        explore(i + 1)                      # @skip

    explore(0)                              # @init
    return res                              # @done
