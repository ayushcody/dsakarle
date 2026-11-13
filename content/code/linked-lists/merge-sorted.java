class ListNode {
    int val;
    ListNode next;

    ListNode() {}
    ListNode(int val) { this.val = val; }
    ListNode(int val, ListNode next) { this.val = val; this.next = next; }
}

class Solution {
    ListNode mergeSorted(ListNode a, ListNode b) {
        ListNode dummy = new ListNode();       // @init
        ListNode tail = dummy;                 // @init
        while (a != null && b != null) {       // @stop
            if (a.val <= b.val) {              // @compare
                tail.next = a;                 // @attach
                a = a.next;                    // @attach
            } else {
                tail.next = b;                 // @attach
                b = b.next;                    // @attach
            }
            tail = tail.next;                  // @advance
        }
        tail.next = (a != null) ? a : b;       // @leftover
        return dummy.next;                     // @done
    }
}
