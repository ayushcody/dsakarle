def can_jump(nums):
    last = len(nums) - 1                    # @init
    reach = 0                               # @init
    for i in range(last + 1):
        if i > reach:                       # @check
            break                           # @stuck
        reach = max(reach, i + nums[i])     # @extend
        if reach >= last:                   # @done
            break
    return reach >= last                    # @done
