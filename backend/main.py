import asyncio
import logging
from weakref import ref

from consts import cards
from fastapi import FastAPI, WebSocket
from random import sample
from websocket import ws_manager


logger = logging.getLogger(__name__)

app = FastAPI()


class Table:
    def __init__(self):
        player_cards: dict[str, list[str]] = {}
        pot: int = 0
        player_bets: dict[str, int] = {}
        player_status: dict[str, str] = {}
        community_cards: list[str] = []
        current_player: str = ""
        current_bet: int = 0
        dealer: str = ""
        small_blind: str = ""
        big_blind: str = ""
        player_num: int = 0
        deck_of_cards: list[str] = cards
        game_stage: int = 0
        player_order: list[str] = []
        next_player: int = 0
        prev_bet: int = 0

    def add_player(self, player: str):
        self.player_cards[player] = []
        self.player_bets[player] = 0
        self.player_status[player] = "active"

    def remove_player(self, player: str):
        del self.player_cards[player]
        del self.player_bets[player]
        del self.player_status[player]

    def refill_deck(self):
        self.deck_of_cards = cards

    def deal_cards(self):
        self.refill_deck()

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

    def action(self, player: str, action: str, bet: int = 0):
        if player != self.player_order[self.next_player]:
            print("Not your turn")
            return

        if action == "bet":
            if bet < self.current_bet:
                print("Bet must be at least", self.current_bet)
                return

            self.player_bets[player] += bet
            self.current_bet = bet
            self.player_status[player] = "bet"


@app.websocket("/ws/betting/{tableId}/{wsId}")
async def websocket_betting(websocket: WebSocket, tableId: str, wsId: str):
    await ws_manager.connect(websocket)

    async def receive_command(websocket: WebSocket):
        async for cmd in websocket.iter_json():
            logger.debug("putting %s in command queue", cmd)
            print(tableId, cmd)

            if isinstance(cmd, int):
                print("Bet:", cmd)

            else:
                if cmd:
                    print("Check")
                else:
                    print("Fold")

            await ws_manager.broadcast(str(cmd), "betting")

    await receive_command(websocket)
