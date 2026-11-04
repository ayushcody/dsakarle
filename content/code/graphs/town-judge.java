class Solution {
    int findJudge(int n, int[][] trust) {
        int[] balance = new int[n + 1];
        for (int[] t : trust) {
            balance[t[0]]--;
            balance[t[1]]++;
        }
        for (int person = 1; person <= n; person++) {
            if (balance[person] == n - 1) {
                return person;
            }
        }
        return -1;
    }
}
