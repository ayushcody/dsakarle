def delete(nums, size, i):
    last = size - 1                        # @init
    for j in range(i, last):
        nums[j] = nums[j + 1]              # @shift
    nums[last] = 0                         # @clear
    return last                            # @done
