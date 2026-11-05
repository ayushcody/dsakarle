def fill(image, r, c, old, color):
    rows, cols = len(image), len(image[0])
    if r < 0 or r >= rows or c < 0 or c >= cols:
        return
    if image[r][c] != old:
        return
    image[r][c] = color
    fill(image, r - 1, c, old, color)
    fill(image, r + 1, c, old, color)
    fill(image, r, c - 1, old, color)
    fill(image, r, c + 1, old, color)


def flood_fill(image, sr, sc, color):
    result = [row[:] for row in image]
    old = result[sr][sc]
    if old != color:
        fill(result, sr, sc, old, color)
    return result
