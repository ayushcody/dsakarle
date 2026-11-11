class ListNode {
    int val;
    ListNode next;

    ListNode(int val) { this.val = val; }
    ListNode(int val, ListNode next) { this.val = val; this.next = next; }
}

class Solution {
    ListNode detectCycle(ListNode head) {
        ListNode slow = head;              // @init
        ListNode fast = head;              // @init
        while (fast != null && fast.next != null) {   // @check
            slow = slow.next;              // @move
            fast = fast.next.next;         // @move
            if (slow == fast) {            // @meet
                slow = head;               // @reset
                while (slow != fast) {     // @walk
                    slow = slow.next;      // @walk
                    fast = fast.next;      // @walk
                }
                return slow;               // @done
            }
        }
        return null;                       // @done
    }
}
