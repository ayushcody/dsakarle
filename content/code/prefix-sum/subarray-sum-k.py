def subarray_sum(nums, k):
    seen = {0: 1}                                    # @init
    running = 0                                      # @init
    count = 0                                        # @init
    for i in range(len(nums)):
        running += nums[i]                           # @add
        count += seen.get(running - k, 0)            # @check
        seen[running] = seen.get(running, 0) + 1     # @store
    return count                                     # @done
