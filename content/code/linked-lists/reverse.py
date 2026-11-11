class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next


def reverse_list(head):
    prev = None                    # @init
    curr = head                    # @init
    while curr is not None:        # @check
        nxt = curr.next            # @save
        curr.next = prev           # @flip
        prev = curr                # @advance
        curr = nxt                 # @advance
    return prev                    # @done
