{empty, ln, sum} = require \prelude-ls

is-root = (.is-root)
is-leaf = (.is-leaf)
is-direct = (.is-direct)

class Node

    (@label, @id, @description, origin, syms) ~>
        @counts = []
        @sources = [origin]
        @symbols = syms.slice!
        @edges = []
        @depths = []

    marked: false
    muted: false
    is-leaf: false
    is-root: false
    is-direct: false

    radius: ->
        k = 5
        count-portion = if empty @counts then 0 else 1.5 * ln @get-total-count!
        marked-fac = if @marked then 2 else 1
        (k + count-portion) * marked-fac

    get-total-count: -> sum @counts

    add-count: (c) -> @counts.push c if c?

new-node = (src, syms, id, label, desc) --> Node label, id, desc, src, syms

module.exports = {Node, new-node, is-leaf, is-root, is-direct}

