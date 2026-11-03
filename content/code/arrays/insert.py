def insert(nums, size, i, value):
    if size == len(nums):                  # @room
        return -1                          # @room
    for j in range(size, i, -1):
        nums[j] = nums[j - 1]              # @shift
    nums[i] = value                        # @write
    return size + 1                        # @done
