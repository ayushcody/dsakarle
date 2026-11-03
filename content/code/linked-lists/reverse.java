class ListNode {
    int val;
    ListNode next;

    ListNode(int val) { this.val = val; }
    ListNode(int val, ListNode next) { this.val = val; this.next = next; }
}

class Solution {
    ListNode reverseList(ListNode head) {
        ListNode prev = null;              // @init
        ListNode curr = head;              // @init
        while (curr != null) {             // @check
            ListNode nxt = curr.next;      // @save
            curr.next = prev;              // @flip
            prev = curr;                   // @advance
            curr = nxt;                    // @advance
        }
        return prev;                       // @done
    }
}
