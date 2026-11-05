def remove_duplicates(nums):
    slow = 0                                # @init
    for fast in range(1, len(nums)):        # @read
        if nums[fast] != nums[slow]:        # @compare
            slow += 1                       # @write
            nums[slow] = nums[fast]         # @write
    return slow + 1                         # @done
