int factorial(int n, int stop) {
    if (n <= stop) {                        // @check
        return 1;                           // @base
    }
    int smaller = factorial(n - 1, stop);   // @call
    return n * smaller;                     // @combine
}
