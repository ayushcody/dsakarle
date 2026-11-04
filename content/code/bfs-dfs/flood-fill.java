class Solution {
    void fill(int[][] image, int r, int c, int old, int color) {
        int rows = image.length, cols = image[0].length;
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

    int[][] floodFill(int[][] image, int sr, int sc, int color) {
        int[][] result = new int[image.length][];
        for (int r = 0; r < image.length; r++) {
            result[r] = image[r].clone();
        }
        int old = result[sr][sc];
        if (old != color) {
            fill(result, sr, sc, old, color);
        }
        return result;
    }
}
