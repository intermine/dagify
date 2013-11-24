{any, minimum, map, fold, unique} = require 'prelude-ls'

export get-rank = (g, n) -->
    succ = g.successors n
    if succ.length
        1 + minimum map (get-rank g), succ
    else
        0

# Assumes a singly rooted tree, found by following successors.
export get-root = (g, n) -->
    [next] = g.successors n
    if next?
        get-root g, next
    else
        n

export can-reach-any = (g, roots, nid) -->
    succ = g.successors nid
    (nid in roots) or (any (can-reach-any g, roots), succ)

transitive-closure = (f, g, n) -->
    for-node = f g, n
    unique fold (++), for-node, map (transitive-closure f, g), for-node

export descendents-of = transitive-closure (g, n) -> g.predecessors n

export ancestors-of = transitive-closure (g, n) -> g.successors n
