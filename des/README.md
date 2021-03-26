# des

Run with:

    clojure -X des.core/main

Test with:

    clojure -M:test

### To Do

- Fix names of registry
- Rename put-node, get-node, etc. to something better
  - send-put?
- Wrap up node in a record
- Fix put/get test -- retry get? Or ack from put? Or just put/get using same node?
- Homogeneous nodes rather than special bootstrap node?
- Result should contain key in addition to value (or request ID)
- Global phonebook
