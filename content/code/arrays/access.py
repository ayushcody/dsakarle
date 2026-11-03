def access(nums, i):
    base, size = 1000, 4                         # @init
    if i < 0 or i >= len(nums):                  # @check
        raise IndexError("index out of range")   # @check
    address = base + i * size                    # @address
    return nums[(address - base) // size]        # @read
