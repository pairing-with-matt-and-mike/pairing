import sqlite3
import socket

DB_PATH = "craft.db"

db = sqlite3.connect(DB_PATH)

game = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
game.connect(("localhost", 4080))
game.sendall('A,%s,%s\n' % ("x", 1))

blocks = list(db.execute(
    """
    select * from block
    where x between 31 and 36
    and z between 0 and 5
    and w <> 0;"""))

for p, q, x, y, z, w in blocks:
    print x, y, z
    game.sendall('B,%s,%s,%s,%s\n' % (x + 20, y, z, w))
    game.sendall('B,%s,%s,%s,%s\n' % (x + 40, y, z, w))
    game.sendall('B,%s,%s,%s,%s\n' % (x + 20, y, z + 20, w))
    game.sendall('B,%s,%s,%s,%s\n' % (x + 40, y, z + 20, w))
#    for height in range(0, 50):
#    game.sendall('B,%s,%s,%s,%s\n' % (x + 5, y, z, w))
