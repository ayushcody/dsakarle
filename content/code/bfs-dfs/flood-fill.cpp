#include <vector>

void fill(std::vector<std::vector<int>>& image, int r, int c, int old, int color) {
    int rows = image.size(), cols = image[0].size();
    if (r < 0 || r >= rows || c < 0 || c >= cols) {
        return;
    }
    if (image[r][c] != old) {
        return;
    }
    image[r][c] = color;
    fill(image, r - 1, c, old, color);
    fill(image, r + 1, c, old, color);
    fill(image, r, c - 1, old, color);
    fill(image, r, c + 1, old, color);
}

std::vector<std::vector<int>> floodFill(const std::vector<std::vector<int>>& image, int sr, int sc, int color) {
    std::vector<std::vector<int>> result = image;
    int old = result[sr][sc];
    if (old != color) {
        fill(result, sr, sc, old, color);
    }
    return result;
}
