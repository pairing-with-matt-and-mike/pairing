import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.random.Random
import kotlinx.collections.immutable.persistentListOf

class BlackjackTableTests {
    @Test
    fun startingGameDealsHandsToParticipants() {
        val shoe = Shoe(persistentListOf(
                            Card.from("♥2"),
                            Card.from("♥3"),
                            Card.from("♥4"),
                            Card.from("♥5"),
                            Card.from("♥6"),
                            Card.from("♥7"),
                            Card.from("♥8"),
                            Card.from("♥9"),
                            Card.from("♥T"),
                        ))
        var table = BlackjackTable.setUp(shoe)
        table = table.addPlayer()
        table = table.addPlayer()

        table = table.startGame()

        assertEquals(
            table.players[0].hand,
            Hand(persistentListOf(
                     Card.from("♥T"),
                     Card.from("♥7"),
                 ))
        )
        assertEquals(
            table.players[1].hand,
            Hand(persistentListOf(
                     Card.from("♥9"),
                     Card.from("♥6"),
                 ))
        )
        assertEquals(
            table.dealer.hand,
            Hand(persistentListOf(
                     Card.from("♥8"),
                     Card.from("♥5"),
                 ))
        )
    }

    @Test
    fun scoreHands() {
        var hand = Hand(persistentListOf(Card.from("♥8"), Card.from("♥5")))
        assertEquals(13, hand.score())

        hand = Hand(persistentListOf(Card.from("♥A"), Card.from("♥5")))
        assertEquals(6, hand.score())

        hand = Hand(persistentListOf(Card.from("♥9"), Card.from("♥8"), Card.from("♥5")))
        assertEquals(22, hand.score())
    }
}
