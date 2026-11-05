class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next


def delete_value(head, v):
    dummy = ListNode(0, head)                   # @init
    prev = dummy                                # @init
    curr = head                                 # @init
    while curr is not None and curr.val != v:   # @search
        prev = curr                             # @advance
        curr = curr.next                        # @advance
    if curr is not None:
        prev.next = curr.next                   # @bypass
    return dummy.next                           # @done
