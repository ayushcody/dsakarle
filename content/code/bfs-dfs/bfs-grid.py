from collections import deque


def shortest_path(grid):
    rows, cols = len(grid), len(grid[0])
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == 'S':
                sr, sc = r, c
            if grid[r][c] == 'E':
                er, ec = r, c
    dist = [[-1] * cols for _ in range(rows)]                 # @init
    dist[sr][sc] = 0                                          # @init
    queue = deque([(sr, sc)])                                 # @init
    while queue:
        r, c = queue.popleft()                                # @pop
        if (r, c) == (er, ec):                                # @done
            return dist[r][c]                                 # @done
        for dr, dc in ((-1, 0), (0, 1), (1, 0), (0, -1)):
            nr, nc = r + dr, c + dc
            if nr < 0 or nr >= rows or nc < 0 or nc >= cols:  # @skip
                continue                                      # @skip
            if grid[nr][nc] == '#' or dist[nr][nc] != -1:     # @skip
                continue                                      # @skip
            dist[nr][nc] = dist[r][c] + 1                     # @discover
            queue.append((nr, nc))                            # @discover
    return -1                                                 # @done
