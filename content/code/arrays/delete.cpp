// nums is a fixed-size array: the first `size` slots are in use.
int deleteAt(int nums[], int size, int i) {
    int last = size - 1;                   // @init
    for (int j = i; j < last; j++) {
        nums[j] = nums[j + 1];             // @shift
    }
    nums[last] = 0;                        // @clear
    return last;                           // @done
}
