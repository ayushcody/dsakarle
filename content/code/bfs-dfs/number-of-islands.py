def num_islands(grid):
    rows, cols = len(grid), len(grid[0])
    seen = [[False] * cols for _ in range(rows)]
    count = 0
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == '1' and not seen[r][c]:
                count += 1
                sink(grid, seen, r, c)
    return count


def sink(grid, seen, r, c):
    rows, cols = len(grid), len(grid[0])
    if r < 0 or r >= rows or c < 0 or c >= cols:
        return
    if grid[r][c] == '0' or seen[r][c]:
        return
    seen[r][c] = True
    sink(grid, seen, r - 1, c)
    sink(grid, seen, r + 1, c)
    sink(grid, seen, r, c - 1)
    sink(grid, seen, r, c + 1)
