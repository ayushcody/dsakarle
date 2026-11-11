class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next


def detect_cycle(head):
    slow = head                        # @init
    fast = head                        # @init
    while fast and fast.next:          # @check
        slow = slow.next               # @move
        fast = fast.next.next          # @move
        if slow == fast:               # @meet
            slow = head                # @reset
            while slow != fast:        # @walk
                slow = slow.next       # @walk
                fast = fast.next       # @walk
            return slow                # @done
    return None                        # @done
