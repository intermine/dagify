{reject, empty, any, min, max, each, map, pairs-to-obj} = require \prelude-ls

objectify = (key, value, list) --> list |> pairs-to-obj << map (-> [(key it), (value it)])

error = (msg) -> $.Deferred -> @reject msg

len = (.length)
within = (upper, lower, actual) --> min upper, max lower, actual

# Two reasons: a) alert needs wrapping to prevent rebinding of this, and b) we can swap
# out alert for a better notification system later.
notify = -> alert it

fail-when-empty = (msg, promise) --> promise.then -> if empty it then error msg else it

# Simple alias that makes for cleaner fmapping
do-to = (f, x) -> f x
any-test = (tests, x) --> any (`do-to` x), tests

relationship-test = (link, def-val, x) -->
    | link and link.label => link is x
    | link                => link is x.label
    | otherwise           => def-val

module.exports = {
    to-ltrb, to-xywh, mark-subtree,
    objectify, error, len, within, notify, fail-when-empty, do-to, any-test, relationship-test
}

### Hoisted utils.

function mark-subtree root, prop, val
    queue = [root]
    moar = ({edges}) -> map (.source), edges |> reject (is val) << (.[prop])
    while n = queue.shift!
        n[prop] = val
        each queue~push, moar n
    root

function to-ltrb {x, y, height, width}, k = 1 then
    l: x - k * width / 2
    t: y - k * height / 2
    r: x + k * width / 2
    b: y + k * height / 2

function to-xywh {l, t, r, b} then
    x: l + (r - l) / 2
    y: t + (b - t) / 2
    height: b - t
    width: r - l


