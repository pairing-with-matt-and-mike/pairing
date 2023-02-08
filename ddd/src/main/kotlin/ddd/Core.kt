import kotlin.random.Random
import kotlinx.collections.immutable.PersistentList
import kotlinx.collections.immutable.persistentListOf
import kotlinx.collections.immutable.toPersistentList

class NotTheirTurnException(participant: CurrentTurn) : Exception("${participant}")


enum class Rank(private val short: String, val score: Int) {
    Two("2", 2),
    Three("3", 3),
    Four("4", 4),
    Five("5", 5),
    Six("6", 6),
    Seven("7", 7),
    Eight("8", 8),
    Nine("9", 9),
    Ten("T", 10),
    Jack("J", 10),
    Queen("Q", 10),
    King("K", 10),
    Ace("A", 1);

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
    val score: Int
        get() = rank.score

    override fun toString(): String {
        return "${suit}${rank}"
    }

    companion object {
        fun from(s: String): Card {
            val suit = when (s[0]) {
                '♣' -> Suit.Clubs
                '♦' -> Suit.Diamonds
                '♥' -> Suit.Hearts
                '♠' -> Suit.Spades
                else -> throw Exception()
            }
            val rank = when (s[1]) {
                '2' -> Rank.Two
                '3' -> Rank.Three
                '4' -> Rank.Four
                '5' -> Rank.Five
                '6' -> Rank.Six
                '7' -> Rank.Seven
                '8' -> Rank.Eight
                '9' -> Rank.Nine
                'T' -> Rank.Ten
                'J' -> Rank.Jack
                'Q' -> Rank.Queen
                'K' -> Rank.King
                'A' -> Rank.Ace
                else -> throw Exception()
            }

            return Card(suit, rank)
        }
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

sealed interface Participant {
    val hand: Hand
}

data class Player(override val hand: Hand): Participant {
    fun addCard(card: Card): Player {
        return Player(hand.add(card))
    }

    companion object {
        fun emptyHand(): Player {
            return Player(Hand(persistentListOf()))
        }
    }
}

data class Dealer(override val hand: Hand): Participant {
    fun addCard(card: Card): Dealer {
        return Dealer(hand.add(card))
    }

    companion object {
        fun emptyHand(): Dealer {
            return Dealer(Hand(persistentListOf()))
        }
    }
}

sealed interface CurrentTurn {
    object Dealer: CurrentTurn
    data class Player(val id: Int): CurrentTurn
}

data class Hand(val cards: PersistentList<Card>) {
    fun score(): Int {
        return cards.sumOf { card -> card.score }
    }
    fun add(card: Card): Hand {
        return Hand(cards.add(card))
    }
}


data class BlackjackTable(
    val players: PersistentList<Player>,
    val dealer: Dealer,
    val currentTurn: CurrentTurn,
    val shoe: Shoe,
) {
    fun addPlayer(): BlackjackTable {
        return copy(players = players.add(Player.emptyHand()))
    }

    fun dealCardToCurrentParticipant(): BlackjackTable {
        val (newShoe, card) = shoe.draw()

        val newTable = when (currentTurn) {
            is CurrentTurn.Dealer ->
                copy(dealer = dealer.addCard(card))
            is CurrentTurn.Player -> {
                val index = currentTurn.id
                val newPlayers = players.set(index, players[index].addCard(card))
                copy(players = newPlayers)
            }
        }

        return newTable.copy(shoe = newShoe)
    }

    fun nextParticipant(): BlackjackTable {
        val nextTurn = when (currentTurn) {
            is CurrentTurn.Player ->
                if (currentTurn.id < players.size - 1)
                    CurrentTurn.Player(currentTurn.id + 1)
                else
                    CurrentTurn.Dealer

            CurrentTurn.Dealer -> CurrentTurn.Player(0)
        }
        return copy(currentTurn = nextTurn)
    }

    fun startGame(): BlackjackTable {
        val participants: PersistentList<Participant> =
            (players as PersistentList<Participant>).add(dealer)
        return (1..2 * participants.size).fold(this) { acc, _ ->
            acc.dealCardToCurrentParticipant().nextParticipant()
        }
    }

    fun playerTwists(id: Int): BlackjackTable {
        if (currentTurn != CurrentTurn.Player(id)) {
            // not their turn
            throw NotTheirTurnException(CurrentTurn.Player(id))
        }

        return dealCardToCurrentParticipant()
    }

    fun playerSticks(id: Int): BlackjackTable {
        return nextParticipant()
    }

    companion object {
        fun setUp(random: Random): BlackjackTable {
            val shoe = Shoe.decks(8, random)
            return setUp(shoe)
        }

        fun setUp(shoe: Shoe): BlackjackTable {
            return BlackjackTable(
                persistentListOf(),
                Dealer.emptyHand(),
                CurrentTurn.Player(0),
                shoe,
            )
        }
    }
}

fun main(_args: Array<String>) {
    var table = BlackjackTable.setUp(Random(12345))
    table = table.addPlayer()
    table = table.addPlayer()
    table = table.addPlayer()
    table = table.startGame()
    table = table.playerTwists(0)
    //table = table.playerSticks()
    table = table.playerTwists(2)
    println("Table: ${table}")
    println("${table.shoe.cards.size}")
}
