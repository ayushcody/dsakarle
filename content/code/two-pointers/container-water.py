def container_water(height):
    left = 0                                # @init
    right = len(height) - 1                 # @init
    best = 0                                # @init
    while left < right:
        area = min(height[left], height[right]) * (right - left)  # @measure
        best = max(best, area)              # @record
        if height[left] < height[right]:    # @move-left
            left += 1                       # @move-left
        else:
            right -= 1                      # @move-right
    return best                             # @done
