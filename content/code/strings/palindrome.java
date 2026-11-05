class Solution {
    boolean isPalindrome(String s) {
        int left = 0;                                                  // @init
        int right = s.length() - 1;                                    // @init
        while (left < right) {
            if (!Character.isLetterOrDigit(s.charAt(left))) {          // @skip
                left++;                                                // @skip
            } else if (!Character.isLetterOrDigit(s.charAt(right))) {  // @skip
                right--;                                               // @skip
            } else if (Character.toLowerCase(s.charAt(left))                // @compare
                    != Character.toLowerCase(s.charAt(right))) {       // @compare
                return false;                                          // @done
            } else {
                left++;                                                // @match
                right--;                                               // @match
            }
        }
        return true;                                                   // @done
    }
}
