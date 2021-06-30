from bitarray import bitarray
from bitarray.util import int2ba, ba2int
import hypothesis

@hypothesis.given(hypothesis.strategies.binary())
@hypothesis.example(b"ABCCBAB")
@hypothesis.example(b"A_DEAD_DAD_CEDED_A_BAD_BABE_A_BEADED_ABACA_BED")
def test_encode_then_decode_is_identity(b):
    result = decode(encode(b))
    assert result == b, "was: {}".format(result)

def decode(ba):
    dict_length = ba2int(ba[0:16])
    de_dict_encoded = ba[16:16+dict_length]
    payload = ba[16+dict_length:]
    de_dict = deserialize_dict(de_dict_encoded)
    return b"".join(payload.decode(de_dict))

def encode(b):
    z = bitarray()
    encode_dict = {
        x: int2ba(255-x, length=8)
        for x in range(0, 256)
    }
    z.encode(encode_dict, b)
    decode_dict = {
        symbol.to_bytes(1, byteorder='big'): bits
        for symbol, bits in encode_dict.items()
    }
    serialized_dict = serialize_dict(decode_dict)
    dict_length = int2ba(len(serialized_dict), length=16)
    return dict_length + serialized_dict + z

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
