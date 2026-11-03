class ListNode {
    int val;
    ListNode next;

    ListNode(int val) { this.val = val; }
    ListNode(int val, ListNode next) { this.val = val; this.next = next; }
}

class Solution {
    ListNode insertAfter(ListNode head, int p, int value) {
        ListNode curr = head;                  // @init
        for (int i = 0; i < p; i++) {          // @walk
            curr = curr.next;                  // @walk
        }
        ListNode node = new ListNode(value);   // @create
        node.next = curr.next;                 // @link-new
        curr.next = node;                      // @link-curr
        return head;                           // @done
    }
}
