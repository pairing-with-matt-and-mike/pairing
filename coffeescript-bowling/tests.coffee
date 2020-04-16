bowling = require "./"

exports["empty game"] = (test) ->
        game = new bowling.Game
        # game.bowl 9
        test.equals game.score(), 0
        test.done()

exports["score of game with no spares and strikes is total number of pins knocked down"] = (test) ->
        game = new bowling.Game
        game.bowl 1
        game.bowl 4
        game.bowl 7
        game.bowl 2
        test.equals game.score(), 14
        test.done()

exports["strike, 4, 5 scores 28"] = (test) ->
        game = new bowling.Game
        game.bowl 10
        game.bowl 4
        game.bowl 5
        test.equals game.score(), 28
        test.done()

exports["0, 10 is not strike"] = (test) ->
        game = new bowling.Game
        game.bowl 0
        game.bowl 10
        game.bowl 0
        game.bowl 2
        test.equals game.score(), 12
        test.done()
