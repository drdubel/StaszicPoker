from random import sample

from backend.arbiter import arbiter
from backend.consts import cards
from backend.websocket import ws_manager


class Table:
    tableId: int = 0

    def __init__(self, min_bet: int):
        Table.tableId = Table.tableId % int(1e18)
        self.tableId: int = Table.tableId
        self.community_cards: list[str] = ["CB" for _ in range(5)]
        self.last_bet: int = 0
        self.first_to_act: int = 0
        self.dealer: int = 0
        self.small_blind: int = 0
        self.big_blind: int = 0
        self.deck_of_cards: list[str] = cards.copy()
        self.game_stage: int = 0
        self.current_player: int = 0
        self.player_num: int = 0
        self.player_bets: dict[str, int] = {}
        self.player_whole_bets: dict[str, int] = {}
        self.player_cards: dict[str, list[str]] = {}
        self.player_chips: dict[str, int] = {}
        self.player_order: list[str] = []
        self.active_players: list[str] = []
        self.pot: int = 0
        self.min_bet: int = min_bet
        self.prev_bet: int = 0
        self.current_bet: int = 0
        self.started: bool = False

        Table.tableId += 1

    def add_player(self, player: str, buyIn: int):
        self.player_cards[player] = []
        self.player_bets[player] = 0
        self.player_order.append(player)
        self.player_chips[player] = buyIn
        self.player_whole_bets[player] = 0
        self.player_num += 1

    def remove_player(self, player: str):
        del self.player_cards[player]
        del self.player_bets[player]
        del self.player_chips[player]
        del self.player_whole_bets[player]
        self.player_order.remove(player)
        self.player_num -= 1

    def refill_deck(self):
        self.deck_of_cards = cards.copy()

    async def deal_cards(self):
        for i, player in enumerate(self.player_order):
            self.player_cards[player] = sample(self.deck_of_cards, 2)

            self.deck_of_cards.remove(self.player_cards[player][0])
            self.deck_of_cards.remove(self.player_cards[player][1])

            print(self.player_cards[player])
            await ws_manager.broadcast(self.player_cards[player], f"betting/{self.tableId}/{self.player_order[i]}")

    async def deal_community_cards(self):
        match self.game_stage:
            case 0:
                for i, card in enumerate(sample(self.deck_of_cards, 3)):
                    self.community_cards[i] = card

                self.deck_of_cards.remove(self.community_cards[0])
                self.deck_of_cards.remove(self.community_cards[1])
                self.deck_of_cards.remove(self.community_cards[2])

            case 1:
                self.community_cards[3] = sample(self.deck_of_cards, 1)[0]

                self.deck_of_cards.remove(self.community_cards[3])

            case 2:
                self.community_cards[4] = sample(self.deck_of_cards, 1)[0]

                self.deck_of_cards.remove(self.community_cards[4])

        print(self.community_cards)
        await ws_manager.broadcast(self.community_cards, f"betting/{self.tableId}")

    async def new_round(self):
        self.refill_deck()
        await self.deal_cards()

        self.community_cards = ["CB" for _ in range(5)]
        self.player_bets = {player: 0 for player in self.player_cards.keys()}
        self.active_players = self.player_order
        self.current_bet = 2 * self.min_bet
        self.prev_bet = 0
        self.pot = 3 * self.min_bet
        self.dealer = self.small_blind
        self.small_blind = self.big_blind
        self.big_blind = (self.big_blind + 1) % self.player_num
        self.first_to_act = self.small_blind
        self.current_player = self.first_to_act
        self.last_bet = (self.big_blind + 1) % self.player_num
        self.current_bet = 2 * self.min_bet
        self.game_stage = 0

        self.player_bets[self.player_order[self.small_blind]] = self.min_bet
        self.player_bets[self.player_order[self.big_blind]] = 2 * self.min_bet
        self.player_chips[self.player_order[self.small_blind]] -= self.min_bet
        self.player_chips[self.player_order[self.big_blind]] -= 2 * self.min_bet
        self.player_whole_bets[self.player_order[self.small_blind]] += self.min_bet
        self.player_whole_bets[self.player_order[self.big_blind]] += 2 * self.min_bet

        for player in self.player_order:
            await ws_manager.broadcast(f"C{self.player_chips[player]}", f"betting/{self.tableId}/{player}")
            await ws_manager.broadcast(f"M{self.player_bets[player]}", f"betting/{self.tableId}/{player}")

        await ws_manager.broadcast(f"G{self.current_player}", f"betting/{self.tableId}")
        await ws_manager.broadcast(f"B{self.current_bet}", f"betting/{self.tableId}")
        await ws_manager.broadcast(f"P{self.pot}", f"betting/{self.tableId}")
        await ws_manager.broadcast(self.community_cards, f"betting/{self.tableId}")

    async def next_stage(self):
        if self.game_stage == 3:
            await self.end_game()

            return

        self.current_bet = 0
        self.prev_bet = 0
        self.last_bet = self.small_blind
        self.first_to_act = self.player_order.index(self.active_players[0])
        self.pot += sum(self.player_bets.values())
        self.player_bets = {player: 0 for player in self.player_cards.keys()}
        self.current_player = self.first_to_act

        await self.deal_community_cards()

        for player in self.player_order:
            await ws_manager.broadcast(f"M{self.player_bets[player]}", f"betting/{self.tableId}/{player}")

        await ws_manager.broadcast(f"B{self.current_bet}", f"betting/{self.tableId}")

        self.game_stage += 1

    async def end_game(self):
        winning_order = arbiter(self.player_cards, self.community_cards)
        print(winning_order)

        await self.new_round()

    def get_current_player(self):
        return self.player_order[self.current_player]

    async def next_player(self):
        self.current_player = self.player_order.index(
            self.active_players[(self.current_player + 1) % len(self.active_players)]
        )

        if len(self.active_players) == 1:
            print("coooooooooooooooo!")
            await self.end_game()

            return

        if self.current_player == self.last_bet:
            print("next stage")
            await self.next_stage()

        elif self.player_chips[self.player_order[self.current_player]] == 0:
            await self.next_player()

        else:
            print("next player")

        await ws_manager.broadcast(f"G{self.current_player}", f"betting/{self.tableId}")
        await ws_manager.broadcast(f"P{self.pot}", f"betting/{self.tableId}")

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
                if bet == self.player_chips[player] and bet < self.current_bet:
                    self.player_chips[player] = 0
                    self.player_bets[player] = bet
                    self.player_whole_bets[player] += bet

                    await self.next_player()

                    return

                if bet < self.current_bet or bet % self.min_bet != 0 or bet < self.current_bet - self.prev_bet:
                    print("Wrong bet!")

                    return False

                if bet > self.player_chips[player]:
                    print("Not enough money!")

                    return False

                if bet > self.current_bet:
                    self.last_bet = self.current_player

                self.player_whole_bets[player] += bet
                self.player_bets[player] = bet
                self.player_chips[player] -= bet
                self.prev_bet = self.current_bet
                self.current_bet = bet

                await ws_manager.broadcast(
                    f"C{self.player_chips[player]}",
                    f"betting/{self.tableId}/{player}",
                )

        await ws_manager.broadcast(f"B{bet}", f"betting/{self.tableId}")
        await ws_manager.broadcast(f"M{self.player_bets[player]}", f"betting/{self.tableId}/{player}")
        await self.next_player()
