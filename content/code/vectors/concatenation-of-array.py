def get_concatenation(nums):
    n = len(nums)
    ans = [0] * (2 * n)          # ask for all 2n slots once: no resizing
    for i in range(n):
        ans[i] = nums[i]
        ans[i + n] = nums[i]
    return ans
