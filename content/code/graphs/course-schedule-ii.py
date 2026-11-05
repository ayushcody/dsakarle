from collections import deque


def find_order(num_courses, prerequisites):
    adj = [[] for _ in range(num_courses)]              # @indegree
    indegree = [0] * num_courses                        # @indegree
    for course, before in prerequisites:                # @indegree
        adj[before].append(course)                      # @indegree
        indegree[course] += 1                           # @indegree
    queue = deque(i for i in range(num_courses) if indegree[i] == 0)   # @seed
    order = []                                          # @seed
    while queue:
        u = queue.popleft()                             # @pop
        order.append(u)                                 # @pop
        for v in adj[u]:
            indegree[v] -= 1                            # @drop
            if indegree[v] == 0:                        # @ready
                queue.append(v)                         # @ready
    return order if len(order) == num_courses else []   # @finish
