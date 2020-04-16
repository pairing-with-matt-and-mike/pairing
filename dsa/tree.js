console.log("heelo");

var tree = {
    create: function () {
        return {};
    },
    insert: function (t, value) {
        if (t.value === undefined) {
            t.value = value;
            t.level = 1;
        } else if (value > t.value) {
            if (t.right === undefined) t.right = {};
            t.right = tree.insert(t.right, value);
        } else if (value < t.value) {
            if (t.left === undefined) t.left = {};
            t.left = tree.insert(t.left, value);
        }
        t = tree._skew(t);
        t = tree._split(t);
        return t;
    },
    remove: function (t, value) {
        if (t.value === value) {
            delete t.value;
            if (t.left) {
                t.value = t.left.value;
                tree._removeFromBranch(t, "left", t.value);
            } else if (t.right) {
                t.value = t.right.value;
                tree._removeFromBranch(t, "right", t.value);
            }
        } else if (value < t.value) {
            tree._removeFromBranch(t, "left", value);
        } else {
            tree._removeFromBranch(t, "right", value);
        }
        return t;
    },
    _removeFromBranch: function(t, branch, value) {
        tree.remove(t[branch], value);
        if (t[branch].value === undefined) {
            delete t[branch];
        }
    },
    _skew: function(t) {
        if (t.left && t.left.level === t.level) {
            var left = t.left;
            t.left = left.right;
            left.right = t;
            return left;
        } else {
            return t;
        }
    },
    _split: function(t) {
        if (t.right && t.right.right && t.level === t.right.right.level) {
            var right = t.right;
            t.right = right.left;
            right.left = t;
            right.level++;
            return right;
        } else {
            return t;
        }
    },
    contains: function (t, value) {
        if (value === t.value) {
            return true;
        }
        if (value > t.value) {
            return t.right && tree.contains(t.right, value);
        }
        if (value < t.value) {
            return t.left && tree.contains(t.left, value);
        }
        return false;
    },
    depthFirst: function(t, func) {
        if (t.left) {
            tree.depthFirst(t.left, func);
        }
        if (t.value !== undefined) {
            func(t.value);
        }
        if (t.right) {
            tree.depthFirst(t.right, func);
        }
    },
    fromArray: function (values) {
        var t = tree.create();
        values.forEach(function(value) {
            t = tree.insert(t, value);
        });
        return t;
    }
};


exports["insert at root"] = function(test) {
    var t = tree.create();
    t = tree.insert(t, 1);
    assertIsTree(test, t, { value: 1 });
    test.done();
};

exports["insert smaller then larger item"] = function(test) {
    var t = tree.create();
    t = tree.insert(t, 1);
    t = tree.insert(t, 2);
    assertIsTree(test, t, { value: 1,
                            right: { value: 2 } });
    test.done();
};

exports["insert larger then smaller item"] = function(test) {
    var t = tree.fromArray([2, 1]);
    assertIsTree(test, t, { value: 1,
                            right: { value: 2 } });
    test.done();
};

exports["tree is set-like"] = function(test) {
    var t = tree.fromArray([2, 2]);
    assertIsTree(test, t, { value: 2 });
    test.done();
};

exports["insert of three successively larger items"] = function(test) {
    var t = tree.fromArray([1, 2, 3]);
    assertIsTree(test, t, { value: 2,
                            left: { value: 1 },
                            right: { value: 3 } });
    test.done();
};

exports["insert of three successively smaller items"] = function(test) {
    var t = tree.fromArray([3, 2, 1]);
    assertIsTree(test, t, { value: 2,
                            left: { value: 1 },
                            right: { value: 3 } });
    test.done();
};

exports["insert of four successively larger items"] = function(test) {
    var t = tree.fromArray([2, 3, 4, 1]);
    assertIsTree(test, t, { value: 3,
                            left: { value: 1,
                                    right: { value: 2 }},
                            right: { value: 4 } });
    test.done();
};

exports["insert of five successively larger items"] = function(test) {
    var t = tree.fromArray([0, 1, 2, 3, 4, 5, 6]);
    assertIsTree(test, t, { value: 3,
                            left: { value: 1,
                                    left: { value: 0 },
                                    right: { value: 2 } },
                            right: { value: 5,
                                     left: { value: 4 },
                                     right: { value: 6 } } });
    test.done();
};

exports["contains is true when tree contains item"] = function(test) {
    var t = tree.fromArray([1, 6, 4]);
    test.ok(tree.contains(t, 1));
    test.ok(tree.contains(t, 6));
    test.ok(tree.contains(t, 4));
    test.ok(!tree.contains(t, 0));
    test.done();
};

exports["depth first traversal"] = function(test) {
    var t = tree.fromArray([1, 6, 4, 2, 7, 8]);
    var vs = [];
    tree.depthFirst(t, function (x) { vs.push(x); });
    test.deepEqual(vs, [1, 2, 4, 6, 7, 8]);
    test.done();
};

exports["depth first traversal on empty tree never calls function"] = function(test) {
    var t = tree.create();
    tree.depthFirst(t, function() {
        test.fail();
    });
    test.done();
};

// TODO: implement rebalancing after remove

// exports["remove can remove value in singleton"] = function(test) {
//     var t = tree.fromArray([1]);
//     t = tree.remove(t, 1);
//     assertIsTree(test, t, {});
//     test.done();
// };

// exports["remove can remove left leaf"] = function(test) {
//     var t = tree.fromArray([2, 1]);
//     t = tree.remove(t, 1);
//     assertIsTree(test, t, { value: 2 });
//     test.done();
// };

// exports["remove can remove right leaf"] = function(test) {
//     var t = tree.fromArray([1, 2]);
//     t = tree.remove(t, 2);
//     assertIsTree(test, t, { value: 1 });
//     test.done();
// };

// exports["remove can remove root with both left and right"] = function(test) {
//     var t = tree.fromArray([2, 1, 3]);
//     t = tree.remove(t, 2);
//     assertIsTree(test, t, { value: 1,
//                             right: { value: 3 } });
//     test.done();
// };

// exports["remove can remove root with two lefts"] = function(test) {
//     var t = tree.fromArray([3, 2, 1]);
//     t = tree.remove(t, 3);
//     assertIsTree(test, t, { value: 2,
//                             left: { value: 1 } });
//     test.done();
// };

// exports["remove can remove root with two rights"] = function(test) {
//     var t = tree.fromArray([1, 2, 3]);
//     t = tree.remove(t, 1);
//     assertIsTree(test, t, { value: 2,
//                             right: { value: 3 } });
//     test.done();
// };

// exports["remove can remove a left node that has children"] = function(test) {
//     var t = tree.fromArray([4, 2, 1, 3]);
//     t = tree.remove(t, 2);
//     assertIsTree(test, t, { value: 3,
//                             left: { value: 1 },
//                             right: { value: 4 } });
//     test.done();
// };

// exports["remove can remove a right node that has children"] = function(test) {
//     var t = tree.fromArray([1, 3, 2, 4]);
//     t = tree.remove(t, 3);
//     assertIsTree(test, t, { value: 2,
//                             left: { value: 1 },
//                             right: { value: 4 } });
//     test.done();
// };

function assertIsTree (test, actual, expected) {
    test.deepEqual(extractTree(actual), expected);
}

function extractTree(tree) {
    var extracted = {};
    if (tree.value != null) {
        extracted.value = tree.value;
    }
    if (tree.left) {
        extracted.left = extractTree(tree.left);
    }
    if (tree.right) {
        extracted.right = extractTree(tree.right);
    }
    return extracted;
}

console.log("gobbye");
