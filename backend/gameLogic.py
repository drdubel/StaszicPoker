from random import sample

import structlog

from backend.arbiter import arbiter
from backend.consts import cards
from backend.websocket import ws_manager

logger = structlog.get_logger()


class Player:
    def __init__(self, Id: str, buyIn: int, num: int):
        self.cards: list[str] = []
        self.chips: int = buyIn
        self.bet: int = 0
        self.whole_bet: int = 0
        self.id: str = Id
        self.num: int = num

    def place_bet(self, amount: int):
        self.bet += amount
        self.whole_bet += amount
        self.chips -= amount

    def next_round(self):
        self.bet = 0
        self.whole_bet = 0

    def next_stage(self):
        self.bet = 0


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
        self.players: dict[str, Player] = {}
        self.player_num: int = 0
        self.player_order: list[str] = []
        self.active_players: list[str] = []
        self.pot: int = 0
        self.min_bet: int = min_bet
        self.prev_bet: int = 0
        self.current_bet: int = 0
        self.started: bool = False

        Table.tableId += 1

    def add_player(self, player: str, buyIn: int):
        self.players[player] = Player(player, buyIn, self.player_num)
        self.player_order.append(player)
        self.player_num += 1

    def remove_player(self, player: str):
        del self.players[player]
        self.player_order.remove(player)
        self.player_num -= 1

    def refill_deck(self):
        self.deck_of_cards = cards.copy()

    async def deal_cards(self):
        for i, player in enumerate(self.player_order):
            self.players[player].cards = sample(self.deck_of_cards, 2)

            self.deck_of_cards.remove(self.players[player].cards[0])
            self.deck_of_cards.remove(self.players[player].cards[1])

            logger.info(self.players[player].cards)
            await ws_manager.broadcast(self.players[player].cards, f"betting/{self.tableId}/{self.player_order[i]}")

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

        logger.info(self.community_cards)
        await ws_manager.broadcast(self.community_cards, f"betting/{self.tableId}")

    async def next_round(self):
        self.refill_deck()
        await self.deal_cards()

        self.community_cards = ["CB" for _ in range(5)]

        for player in self.player_order:
            self.players[player].next_round()

        self.active_players = self.player_order
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

        self.players[self.player_order[self.small_blind]].place_bet(self.min_bet)
        self.players[self.player_order[self.big_blind]].place_bet(2 * self.min_bet)

        for player in self.player_order:
            await ws_manager.broadcast(f"C{self.players[player].chips}", f"betting/{self.tableId}/{player}")
            await ws_manager.broadcast(f"M{self.players[player].bet}", f"betting/{self.tableId}/{player}")

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
        self.first_to_act = self.player_order.index(self.active_players[0])
        self.last_bet = self.first_to_act

        for player in self.player_order:
            self.players[player].next_stage()

        self.current_player = self.first_to_act

        await self.deal_community_cards()

        for player in self.player_order:
            await ws_manager.broadcast(f"M{self.players[player].bet}", f"betting/{self.tableId}/{player}")

        await ws_manager.broadcast(f"B{self.current_bet}", f"betting/{self.tableId}")
        await ws_manager.broadcast(f"G{self.current_player}", f"betting/{self.tableId}")

        self.game_stage += 1

        if len(self.active_players) == 1:
            logger.info("Only one player left!")
            await self.end_game()

            return

        if self.players[self.player_order[self.current_player]].chips == 0:
            logger.info("no chips")
            await self.next_player()

            return

    def distribute_chips(self, winning_order: list[list[int]]):
        pot = 0

        for place in winning_order:
            playersW = sorted([self.player_order[player] for player in place], key=lambda x: self.players[x].whole_bet)

            while playersW:
                playerW = playersW[0]

                if len([playerL for playerL in self.players.values() if playerL.whole_bet > 0]) == 0:
                    break

                potMax = self.players[playerW].whole_bet

                for playerL in self.players.values():
                    pot += min(potMax, playerL.whole_bet)
                    playerL.whole_bet = max(0, playerL.whole_bet - potMax)

                for playerW in playersW:
                    self.players[playerW].chips += pot // len(playersW)

                pot = 0
                playersW = [playerW for playerW in playersW if self.players[playerW].whole_bet > 0]

            if len([playerL for playerL in self.players.values() if playerL.whole_bet > 0]) == 0:
                break

        logger.info([self.players[player].chips for player in self.player_order])

    async def end_game(self):
        if len(self.active_players) == 1:
            logger.info("Only one player left!")

            self.players[self.active_players[0]].chips += self.pot

        else:
            winning_order = arbiter(
                {self.players[player]: self.players[player].cards for player in self.active_players},
                self.community_cards,
            )

            logger.info(winning_order)

            self.distribute_chips(winning_order)

        for player in self.player_order:
            await ws_manager.broadcast(f"C{self.players[player].chips}", f"betting/{self.tableId}/{player}")

        await ws_manager.broadcast(f"E{winning_order}", f"betting/{self.tableId}")

        to_remove = []
        for player in self.players.values():
            if player.chips == 0:
                await ws_manager.broadcast(f"X{player.id}", f"betting/{self.tableId}")
                to_remove.append(player.id)

        for player in to_remove:
            self.remove_player(player)

        if len(self.players) < 2:
            logger.info("Not enough players left!")

    def get_current_player(self):
        return self.player_order[self.current_player]

    async def next_player(self):
        self.current_player = self.player_order.index(
            self.active_players[(self.current_player + 1) % len(self.active_players)]
        )

        if len(self.active_players) == 1:
            logger.info("Only one player left!")
            await self.end_game()

        elif self.current_player == self.last_bet:
            logger.info("next stage")
            await self.next_stage()

        elif self.players[self.player_order[self.current_player]].chips == 0:
            logger.info("no chips")
            await self.next_player()

        else:
            await ws_manager.broadcast(f"G{self.current_player}", f"betting/{self.tableId}")

    async def action(self, player: str, bet: int = 0):
        if player != self.player_order[self.current_player] or player not in self.active_players:
            logger.warning("Not your turn")

            return False

        match bet:
            case 0:
                if self.current_bet != self.players[player].bet:
                    logger.warning("Wrong check!")

                    return False

            case -1:
                self.active_players.remove(player)

                if len(self.active_players) == 1:
                    logger.info("Only one player left!")

                    await self.end_game()

                    return

            case _:
                if (
                    bet + self.players[player].bet < self.current_bet
                    or bet % self.min_bet != 0
                    or bet + self.players[player].bet < self.current_bet - self.prev_bet
                ):
                    logger.info((self.players[player].bet, bet, self.current_bet, self.prev_bet))
                    logger.warning("Wrong bet!")

                    return False

                if bet > self.players[player].chips:
                    logger.warning("Not enough money!")

                    return False

                if bet + self.players[player].bet > self.current_bet:
                    self.last_bet = self.current_player
                    self.prev_bet = self.current_bet
                    self.current_bet = self.players[player].bet + bet

                self.players[player].place_bet(bet)
                self.pot += bet
                logger.info((self.pot, bet, self.players[player].bet, self.players[player].whole_bet, self.current_bet))

                await ws_manager.broadcast(
                    f"C{self.players[player].chips}",
                    f"betting/{self.tableId}/{player}",
                )
                await ws_manager.broadcast(f"M{self.players[player].bet}", f"betting/{self.tableId}/{player}")

        await ws_manager.broadcast(f"B{self.current_bet}", f"betting/{self.tableId}")
        await ws_manager.broadcast(f"P{self.pot}", f"betting/{self.tableId}")
        await self.next_player()
