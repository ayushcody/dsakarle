class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next


def middle_node(head):
    slow = head                        # @init
    fast = head                        # @init
    while fast and fast.next:          # @check
        slow = slow.next               # @move
        fast = fast.next.next          # @move
    return slow                        # @done
