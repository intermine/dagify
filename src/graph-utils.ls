{minimum, map} = require 'prelude-ls'

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

export ancestors-of = (g, n) -->
    succ = g.successors n
    succ ++ [a for s in succ for a in ancestors-of g, s]
