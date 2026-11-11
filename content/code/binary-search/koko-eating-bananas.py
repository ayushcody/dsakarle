def min_eating_speed(piles, h):
    lo, hi = 1, max(piles)
    while lo < hi:
        mid = lo + (hi - lo) // 2
        hours = sum((pile + mid - 1) // mid for pile in piles)
        if hours <= h:
            hi = mid
        else:
            lo = mid + 1
    return lo
