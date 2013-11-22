{UniqueCollection} = require './unique-collection.ls'

export class GOTerms extends UniqueCollection

    -> super [], key-fn: (.identifier)

