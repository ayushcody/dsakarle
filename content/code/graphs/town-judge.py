def find_judge(n, trust):
    balance = [0] * (n + 1)
    for a, b in trust:
        balance[a] -= 1
        balance[b] += 1
    for person in range(1, n + 1):
        if balance[person] == n - 1:
            return person
    return -1
