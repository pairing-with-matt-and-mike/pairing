import kotlin.random.Random
import kotlinx.collections.immutable.PersistentList;
import kotlinx.collections.immutable.persistentListOf;
import kotlinx.collections.immutable.toPersistentList;

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

data class Shoe(val cards: PersistentList<Card>) {
    fun draw(): Pair<Shoe, Card> {
        val newCards = cards.removeAt(cards.size - 1)
        return Pair(Shoe(newCards), cards.last())
    }

    companion object {
        fun decks(numberOfDecks: Int, random: Random): Shoe {
            assert(numberOfDecks == 8) {"Not 8 decks"}
            val cards = (1..numberOfDecks).flatMap {
                Deck.cards
            }.toMutableList()
            cards.shuffle(random)
            return Shoe(cards.toPersistentList())
        }
    }
}

data class Player(val cards: PersistentList<Card>) {
    fun addCard(card: Card): Player {
        return Player(cards.add(card))
    }

    companion object {
        fun emptyHand(): Player {
            return Player(persistentListOf())
        }
    }
}

data class BlackjackTable(val players: PersistentList<Player>, val shoe: Shoe) {
    fun addPlayer(): BlackjackTable {
        return copy(players = players.add(Player.emptyHand()))
    }

    fun dealCardToCurrentPlayer(): BlackjackTable {
        val (newShoe, card) = shoe.draw()

        val newPlayers = players.set(0, players[0].addCard(card))

        return BlackjackTable(newPlayers, newShoe)
    }

    fun nextPlayer(): BlackjackTable {
        val player = players.last()
        val players = players.removeAt(players.size - 1)
        return this.copy(players = persistentListOf(player).addAll(players))
    }

    fun startGame(): BlackjackTable {
        return (1..2 * players.size).fold(this) { acc, _ ->
            acc.dealCardToCurrentPlayer().nextPlayer()
        }
    }

    companion object {
        fun setUp(random: Random): BlackjackTable {
            val shoe = Shoe.decks(8, random)
            return BlackjackTable(persistentListOf(), shoe)
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
