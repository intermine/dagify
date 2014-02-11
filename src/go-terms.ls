{UniqueCollection} = require './unique-collection.ls'

export class Terms extends UniqueCollection

    (keyFn = (.identifier)) -> super [], key-fn: keyFn

