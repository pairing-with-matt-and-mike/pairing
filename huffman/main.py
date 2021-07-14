from bitarray import bitarray
from bitarray.util import int2ba, ba2int
import collections
import hypothesis
import sys

@hypothesis.given(hypothesis.strategies.binary())
@hypothesis.example(b"ABCCBAB")
@hypothesis.example(b"A_DEAD_DAD_CEDED_A_BAD_BABE_A_BEADED_ABACA_BED")
def test_encode_then_decode_is_identity(b):
    result = decode(encode(b))
    assert result == b, "was: {}".format(result)

def decode(ba):
    dict_length = ba2int(ba[0:16])
    de_dict_encoded = ba[16:16+dict_length]
    payload_length = ba2int(ba[16+dict_length:16+dict_length+64])
    payload = ba[16+dict_length+64:16+dict_length+64+payload_length]
    de_dict = deserialize_dict(de_dict_encoded)
    if payload:
        return b"".join(payload.decode(de_dict))
    else:
        return b""

def encode(b):
    counts = collections.Counter(b)

    sorted_counts = sorted(
        counts.items(),
        key=lambda item: item[1],
        reverse=True,
    )
    if len(sorted_counts) == 0:
        encodings = []
    elif len(sorted_counts) == 1:
        encodings = [(sorted_counts[0][0], bitarray("0"))]
    else:
        while len(sorted_counts) > 1:
            right, right_count = sorted_counts.pop()
            left, left_count = sorted_counts.pop()
            sorted_counts.append(((left, right), left_count + right_count))
            sorted_counts = sorted(
                sorted_counts,
                key=lambda item: item[1],
                reverse=True,
            )

        tree = sorted_counts[0][0]

        encodings = []

        def f(current_encoding, tree):
            if isinstance(tree, tuple):
                left, right = tree
                left_encoding = current_encoding + bitarray("0")
                f(left_encoding, left)
                right_encoding = current_encoding + bitarray("1")
                f(right_encoding, right)
            else:
                encodings.append((tree, current_encoding))

        f(bitarray(), tree)

    encode_dict = dict(encodings)
    z = bitarray()
    if b:
        z.encode(encode_dict, b)
    decode_dict = {
        symbol.to_bytes(1, byteorder='big'): bits
        for symbol, bits in encode_dict.items()
    }
    serialized_dict = serialize_dict(decode_dict)
    dict_length = int2ba(len(serialized_dict), length=16)
    z_length = int2ba(len(z), length=64)

    return dict_length + serialized_dict + z_length + z

# 'A' => 1
def serialize_dict(encodings):
    result = bitarray()
    for token, encoding in encodings.items():
        result += (
            int2ba(len(encoding), length=8) +
            int2ba(token[0], length=8) +
            encoding
        )
    return result

def deserialize_dict(ba):
    result = {}
    i = 0
    while i < len(ba):
        length = ba2int(ba[i:i+8])
        token = ba[i+8:i+16].tobytes()
        encoding = ba[i+16:i+16+length]
        result[token] = encoding
        i += 8 + 8 + length
    return result

def encode_stdin():
    data = sys.stdin.buffer.read()
    comp = encode(data)
    sys.stdout.buffer.write(comp)
    sys.stdout.buffer.flush()

def decode_stdin():
    comp = sys.stdin.buffer.read()
    ba = bitarray()
    ba.frombytes(comp)
    data = decode(ba)
    sys.stdout.buffer.write(data)

if __name__ == "__main__":
    if sys.argv[1] == "encode":
        encode_stdin()
    elif sys.argv[1] == "decode":
        decode_stdin()
