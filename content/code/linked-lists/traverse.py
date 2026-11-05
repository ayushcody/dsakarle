class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next


def traverse(head):
    total = 0                      # @init
    curr = head                    # @init
    while curr is not None:        # @check
        total += curr.val          # @visit
        curr = curr.next           # @advance
    return total                   # @done
