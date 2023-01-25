import kotlin.random.Random

enum class Rank(private val short: String) {
    Two("2"),
    Three("3"),
    Four("4"),
    Five("5"),
    Six("6"),
    Seven("7"),
    Eight("8"),
    Nine("9"),
    Ten("T"),
    Jack("J"),
    Queen("Q"),
    King("K"),
    Ace("A");

    override fun toString(): String {
        return short
    }
}

enum class Suit(private val short: String) {
    Clubs("♣"),
    Diamonds("♦"),
    Hearts("♥"),
    Spades("♠");

    override fun toString(): String {
        return short
    }
}

data class Card(val suit: Suit, val rank: Rank) {
    override fun toString(): String {
        return "${suit}${rank}"
    }
}

object Deck {
    val cards = Suit.values().flatMap {suit ->
        Rank.values().map {rank ->
            Card(suit, rank)
        }
    }
}

data class Shoe(val cards: List<Card>) {
    fun draw(): Pair<Shoe, Card> {
        val newCards = cards.dropLast(1)
        return Pair(Shoe(newCards), cards.last())
    }

    companion object {
        fun decks(numberOfDecks: Int, random: Random): Shoe {
            assert(numberOfDecks == 8) {"Not 8 decks"}
            val cards = (1..numberOfDecks).flatMap {
                Deck.cards
            }.toMutableList()
            cards.shuffle(random)
            return Shoe(cards)
        }
    }
}

data class Player(val cards: List<Card>) {
    fun addCard(card: Card): Player {
        return Player(cards + card)
    }

    companion object {
        fun emptyHand(): Player {
            return Player(listOf())
        }
    }
}

data class BlackjackTable(val players: List<Player>, val shoe: Shoe) {
    fun addPlayer(): BlackjackTable {
        return copy(players = players + Player.emptyHand())
    }

    fun dealCardToCurrentPlayer(): BlackjackTable {
        var (newShoe, card) = shoe.draw()

        val newPlayers = players.toMutableList()
        newPlayers[0] = newPlayers[0].addCard(card)

        return BlackjackTable(newPlayers, newShoe)
    }

    fun nextPlayer(): BlackjackTable {
        val player = players.last()
        val players = players.dropLast(1)
        return this.copy(players = listOf(player) + players)
    }

    fun startGame(): BlackjackTable {
        return (1..2 * players.size).fold(this) { acc, _ ->
            acc.dealCardToCurrentPlayer().nextPlayer()
        }
    }

    companion object {
        fun setUp(random: Random): BlackjackTable {
            val shoe = Shoe.decks(8, random)
            return BlackjackTable(listOf(), shoe)
        }
    }
}


fun main(_args: Array<String>) {
    var table = BlackjackTable.setUp(Random(12345))
    table = table.addPlayer()
    table = table.addPlayer()
    table = table.addPlayer()
    // table = table.dealCardToCurrentPlayer()
    table = table.startGame()
    println("Table: ${table}")
    println("${table.shoe.cards.size}")
}
