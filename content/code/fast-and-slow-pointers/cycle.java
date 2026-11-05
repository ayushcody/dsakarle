class ListNode {
    int val;
    ListNode next;

    ListNode(int val) { this.val = val; }
    ListNode(int val, ListNode next) { this.val = val; this.next = next; }
}

class Solution {
    boolean hasCycle(ListNode head) {
        ListNode slow = head;              // @init
        ListNode fast = head;              // @init
        while (fast != null && fast.next != null) {   // @check
            slow = slow.next;              // @move
            fast = fast.next.next;         // @move
            if (slow == fast) {            // @meet
                return true;               // @done
            }
        }
        return false;                      // @done
    }
}
