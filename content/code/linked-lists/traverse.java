class ListNode {
    int val;
    ListNode next;

    ListNode(int val) { this.val = val; }
    ListNode(int val, ListNode next) { this.val = val; this.next = next; }
}

class Solution {
    int traverse(ListNode head) {
        int total = 0;                     // @init
        ListNode curr = head;              // @init
        while (curr != null) {             // @check
            total += curr.val;             // @visit
            curr = curr.next;              // @advance
        }
        return total;                      // @done
    }
}
