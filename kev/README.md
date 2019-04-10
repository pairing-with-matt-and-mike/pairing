# Kev

    sudo apt install build-essential python3-pip gdb valgrind
    pip3 install pytest
    export PATH=~/.local/bin:$PATH
    gcc -Wall -g main.c -o kev && ./tests.py -s -v
