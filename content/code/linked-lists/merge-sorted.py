class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next


def merge_sorted(a, b):
    dummy = ListNode()                     # @init
    tail = dummy                           # @init
    while a is not None and b is not None:  # @stop
        if a.val <= b.val:                 # @compare
            tail.next = a                  # @attach
            a = a.next                     # @attach
        else:
            tail.next = b                  # @attach
            b = b.next                     # @attach
        tail = tail.next                   # @advance
    tail.next = a if a is not None else b  # @leftover
    return dummy.next                      # @done
