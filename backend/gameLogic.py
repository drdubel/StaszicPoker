from random import sample
import time

from backend.consts import cards
from backend.websocket import ws_manager


class Table:
    tableId: int = 0

    def __init__(self, min_bet: int):
        Table.tableId = Table.tableId % int(1e18)
        self.tableId: int = Table.tableId
        self.community_cards: list[str] = []
        self.last_bet: int = 0
        self.first_to_act: int = 0
        self.dealer: int = 0
        self.small_blind: int = 0
        self.big_blind: int = 0
        self.deck_of_cards: list[str] = cards
        self.game_stage: int = 0
        self.current_player: int = 0
        self.player_num: int = 0
        self.player_bets: dict[str, int] = {}
        self.player_cards: dict[str, list[str]] = {}
        self.player_stacks: dict[str, int] = {}
        self.player_order: list[str] = []
        self.active_players: list[int] = []
        self.pot: int = 0
        self.min_bet: int = min_bet
        self.prev_bet: int = 0
        self.current_bet: int = 0

        Table.tableId += 1

    def add_player(self, player: str, buyIn: int):
        self.player_cards[player] = []
        self.player_bets[player] = 0
        self.player_order.append(player)
        self.player_stacks[player] = buyIn
        self.player_num += 1

    def remove_player(self, player: str):
        del self.player_cards[player]
        del self.player_bets[player]
        del self.player_stacks[player]
        self.player_order.remove(player)
        self.player_num -= 1

    def refill_deck(self):
        self.deck_of_cards = cards

    def deal_cards(self):
        for player in self.player_cards.keys():
            self.player_cards[player] = sample(cards, 2)

            cards.remove(self.player_cards[player][0])
            cards.remove(self.player_cards[player][1])

    def deal_community_cards(self):
        match self.game_stage:
            case 0:
                self.community_cards = sample(cards, 3)
                cards.remove(self.community_cards[0])
                cards.remove(self.community_cards[1])
                cards.remove(self.community_cards[2])
            case 1:
                self.community_cards.append(sample(cards, 1))
                cards.remove(self.community_cards[3])
            case 2:
                self.community_cards.append(sample(cards, 1))
                cards.remove(self.community_cards[4])

    async def new_round(self):
        self.refill_deck()
        self.deal_cards()
        self.player_bets = {player: 0 for player in self.player_cards.keys()}
        self.active_players = list(range(self.player_num))
        self.current_bet = 2 * self.min_bet
        self.prev_bet = 0
        self.pot = 0
        self.dealer = self.small_blind
        self.small_blind = self.big_blind
        self.big_blind = (self.big_blind + 1) % self.player_num
        self.first_to_act = self.small_blind
        self.current_player = self.first_to_act
        self.last_bet = (self.big_blind + 1) % self.player_num
        self.game_stage = 0
        self.player_bets[self.player_order[self.small_blind]] = self.min_bet
        self.player_bets[self.player_order[self.big_blind]] = 2 * self.min_bet

        url = f"betting/{self.tableId}/{self.player_order[self.current_player]}"

        print([connection.url.path for connection in ws_manager.active_connections])

        print("dzialaaa")
        await ws_manager.broadcast("S", url)

    async def next_stage(self):
        self.game_stage += 1
        self.current_bet = 0
        self.prev_bet = 0
        self.last_bet = self.small_blind
        self.first_to_act = self.active_players[0]
        self.pot += sum(self.player_bets.values())
        self.player_bets = {player: 0 for player in self.player_cards.keys()}
        self.current_player = self.first_to_act
        self.deal_community_cards()

        await ws_manager.broadcast("S", f"betting/{self.tableId}/{self.player_order[self.current_player]}")

    def get_current_player(self):
        return self.player_order[self.current_player]

    async def next_player(self):
        self.current_player = self.active_players[
            (self.active_players.index(self.current_player) + 1) % len(self.active_players)
        ]

        if self.current_player == self.last_bet:
            print("next stage")
            self.next_stage()

        else:
            print("next player")
            await ws_manager.broadcast("S", f"betting/{self.tableId}/{self.player_order[self.current_player]}")

    async def action(self, player: str, bet: int = 0):
        if player != self.player_order[self.current_player]:
            print("Not your turn")

            return False

        match bet:
            case 0:
                if self.current_bet > 0:
                    print("Wrong check!")

                    return False

            case -1:
                self.active_players.remove(self.player_order.index(player))

            case _:
                if bet < self.current_bet or bet % self.min_bet != 0 or bet < self.current_bet - self.prev_bet:
                    print("Wrong bet!")

                    return False

                if bet > self.player_stacks[player]:
                    print("Not enough money!")

                    return False

                if bet > self.current_bet:
                    self.last_bet = self.current_player

                self.player_bets[player] = bet
                self.player_stacks[player] -= bet
                self.prev_bet = self.current_bet
                self.current_bet = bet

        await ws_manager.broadcast(bet, f"betting/{self.tableId}")
        await self.next_player()
