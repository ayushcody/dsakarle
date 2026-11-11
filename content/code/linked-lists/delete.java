class ListNode {
    int val;
    ListNode next;

    ListNode(int val) { this.val = val; }
    ListNode(int val, ListNode next) { this.val = val; this.next = next; }
}

class Solution {
    ListNode deleteValue(ListNode head, int v) {
        ListNode dummy = new ListNode(0, head);        // @init
        ListNode prev = dummy;                         // @init
        ListNode curr = head;                          // @init
        while (curr != null && curr.val != v) {       // @search
            prev = curr;                               // @advance
            curr = curr.next;                          // @advance
        }
        if (curr != null) {
            prev.next = curr.next;                     // @bypass
        }
        return dummy.next;                             // @done
    }
}
