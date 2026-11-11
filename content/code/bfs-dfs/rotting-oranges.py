from collections import deque


def oranges_rotting(grid):
    rows, cols = len(grid), len(grid[0])
    minutes = [[-1] * cols for _ in range(rows)]
    queue = deque()
    fresh = 0
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == 2:
                minutes[r][c] = 0
                queue.append((r, c))
            elif grid[r][c] == 1:
                fresh += 1
    last = 0
    while queue:
        r, c = queue.popleft()
        for dr, dc in ((-1, 0), (0, 1), (1, 0), (0, -1)):
            nr, nc = r + dr, c + dc
            if nr < 0 or nr >= rows or nc < 0 or nc >= cols:
                continue
            if grid[nr][nc] != 1 or minutes[nr][nc] != -1:
                continue
            minutes[nr][nc] = minutes[r][c] + 1
            last = minutes[nr][nc]
            fresh -= 1
            queue.append((nr, nc))
    return last if fresh == 0 else -1
