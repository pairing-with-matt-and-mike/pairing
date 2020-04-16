plus = (a, b) -> a + b

class Game
        constructor: () -> @bowls = []
        score: ->
                isFirst = true
                scores = @bowls.map (bowl, index) =>
                        if bowl == 10 and isFirst
                                bowl + @bowls[index + 1] + @bowls[index + 2]
                        else
                                isFirst = !isFirst
                                bowl

                scores.reduce plus, 0
        bowl: (pins) ->
                @bowls.push pins

exports.Game = Game
