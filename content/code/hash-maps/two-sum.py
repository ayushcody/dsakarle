def two_sum(nums, target):
    seen = {}                                   # @init
    answer = []                                 # @init
    for i in range(len(nums)):
        need = target - nums[i]                 # @need
        if need in seen:                        # @check
            answer = [seen[need], i]            # @found
            break                               # @found
        seen[nums[i]] = i                       # @store
    return answer                               # @done
