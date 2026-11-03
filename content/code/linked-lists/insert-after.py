class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next


def insert_after(head, p, value):
    curr = head                    # @init
    for _ in range(p):             # @walk
        curr = curr.next           # @walk
    node = ListNode(value)         # @create
    node.next = curr.next          # @link-new
    curr.next = node               # @link-curr
    return head                    # @done
