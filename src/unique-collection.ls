Backbone = require \backbone
{is-type} = require 'prelude-ls'

export class UniqueCollection extends Backbone.Collection

    (elems, {@key-fn}:opts) ->
        super elems, opts

    is-array = is-type \Array

    add: (args, opts) ->
        to-add = if is-array args then args else [args]
        for arg in to-add
            unless @any((m) ~> (@key-fn arg) is (@key-for m))
                super arg, opts

    key-for: (m) -> @key-fn m.toJSON!

