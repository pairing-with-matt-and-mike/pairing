package ddd

import kotlin.random.Random
import kotlinx.collections.immutable.PersistentList
import kotlinx.collections.immutable.persistentListOf
import kotlinx.collections.immutable.toPersistentList

class NotTheirTurnException(participant: CurrentTurn) : Exception("${participant}")

class InitException() : Exception("This Game has not started!")
class DoneException() : Exception("This Game is Done!")

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

data class Player(val id: PlayerId, override val hand: Hand): Participant {
    fun addCard(card: Card): Player {
        return copy(hand = hand.add(card))
    }

    fun isBust(): Boolean {
        return hand.isBust()
    }

    companion object {
        fun emptyHand(id: PlayerId): Player {
            return Player(id, Hand(persistentListOf()))
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
    object Init: CurrentTurn
    object Dealer: CurrentTurn
    data class Player(val id: PlayerId): CurrentTurn
    object Done: CurrentTurn
}

data class Hand(val cards: PersistentList<Card>) {
    fun score(): Int {
        val hasAce = cards.any { card -> card.rank == Rank.Ace }
        var score = cards.sumOf { card -> card.score }
        return if (hasAce && score + 10 <= 21) {
            score + 10
        } else {
            score
        }
    }
    fun add(card: Card): Hand {
        return Hand(cards.add(card))
    }
    fun isBust(): Boolean {
        return score() > 21
    }
}

data class BlackjackTable(
    val players: PersistentList<Player>,
    val dealer: Dealer,
    val currentTurn: CurrentTurn,
    val shoe: Shoe,
) {
    fun addPlayer(id: PlayerId): BlackjackTable {
        assert(currentTurn == CurrentTurn.Init) {"Game has already started"}
        return copy(players = players.add(Player.emptyHand(id)))
    }

    fun dealCardToCurrentParticipant(): BlackjackTable {
        val (newShoe, card) = shoe.draw()

        val newTable = when (currentTurn) {
            is CurrentTurn.Init -> throw InitException()
            is CurrentTurn.Dealer ->
                copy(dealer = dealer.addCard(card))
            is CurrentTurn.Player -> {
                val index = players.indexOfFirst {
                    it.id == currentTurn.id
                }
                val newPlayers = players.set(index, players[index].addCard(card))
                copy(players = newPlayers)
            }
            is CurrentTurn.Done -> throw DoneException()
        }

        return newTable.copy(shoe = newShoe)
    }

    fun nextParticipant(): BlackjackTable {
        val nextTurn = when (currentTurn) {
            is CurrentTurn.Init -> throw InitException()
            is CurrentTurn.Player -> {
                val currentIdx = players.indexOfFirst {
                    it.id == currentTurn.id
                }
                if (currentIdx < players.size - 1)
                    CurrentTurn.Player(players[currentIdx + 1].id)
                else
                    CurrentTurn.Dealer
            }

            CurrentTurn.Dealer -> CurrentTurn.Player(players[0].id)

            CurrentTurn.Done -> throw DoneException()
        }
        return copy(currentTurn = nextTurn)
    }

    fun startGame(): BlackjackTable {
        val participants: PersistentList<Participant> =
            (players as PersistentList<Participant>).add(dealer)
        val id = players.first().id
        return (1..2 * participants.size).fold(copy(currentTurn = CurrentTurn.Player(id))) { acc, _ ->
            acc.dealCardToCurrentParticipant().nextParticipant()
        }
    }

    fun playerTwists(id: PlayerId): BlackjackTable {
        assertCurrentTurn(CurrentTurn.Player(id))
        val table = dealCardToCurrentParticipant()
        val idx = players.indexOfFirst {
            it.id == id
        }
        if (table.players[idx].hand.isBust()) {
            return table.playerSticks(id)
        } else {
            return table
        }
    }

    fun playerSticks(id: PlayerId): BlackjackTable {
        assertCurrentTurn(CurrentTurn.Player(id))
        return nextParticipant()
    }

    fun dealersTurn(): BlackjackTable {
        assertCurrentTurn(CurrentTurn.Dealer)
        if (dealer.hand.score() >= 17) {
            return copy(currentTurn = CurrentTurn.Done)
        } else {
            return dealCardToCurrentParticipant()
        }
    }

    fun assertCurrentTurn(turn: CurrentTurn) {
        if (currentTurn != turn) {
            // not their turn
            throw NotTheirTurnException(turn)
        }
    }

    fun winningPlayers(): WinningPlayers {
        return WinningPlayers(
            players.filter { isWinner(it) }
                .map { it.id }
                .toSet()
        )
    }

    fun isWinner(player: Player): Boolean {
        return !player.isBust() &&
            (dealer.hand.isBust() ||
                 dealer.hand.score() < player.hand.score())
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
                CurrentTurn.Init,
                shoe,
            )
        }
    }
}

data class WinningPlayers(val playerIds: Set<PlayerId>)

typealias PlayerId = String

fun main(_args: Array<String>) {
    var table = BlackjackTable.setUp(Random(12345))
    table = table.addPlayer("Bob")
        .addPlayer("Luisa")
        .addPlayer("Will")
        .startGame()
        .playerTwists("Bob")
    // .playerTwists("Bob")
    // .playerSticks("Bob")
        .playerSticks("Luisa")
        .playerTwists("Will")
    // .playerSticks("Will")
        .dealersTurn()
        .dealersTurn()
    // .announceResult()
    // .dealersTurn()

    println("Winning players: ${table.winningPlayers()}")

    println("Table: ${table.copy(shoe = Shoe(persistentListOf()))}")


    table = BlackjackTable.setUp(Random(1))
        .addPlayer("Bob")
        .startGame()
    //        .playerTwists("Bob")

    println("Winning players: ${table.winningPlayers()}")

    println("Table: ${table.copy(shoe = Shoe(persistentListOf()))}")


    table = BlackjackTable.setUp(Random(2))
        .addPlayer("Bob")
        .startGame()
        .playerTwists("Bob")

    println("Winning players: ${table.winningPlayers()}")

    println("Table: ${table.copy(shoe = Shoe(persistentListOf()))}")

}
