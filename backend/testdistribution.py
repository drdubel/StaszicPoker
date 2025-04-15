from arbiter import arbiter


class Player:
    def __init__(self, buyIn: int, num: int):
        self.cards: list[str] = []
        self.chips: int = buyIn
        self.bet: int = 0
        self.whole_bet: int = 0
        self.id: str = str(num)
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


player_order = ["0", "1", "2", "3", "4"]

players = {
    "0": Player(100, 0),
    "1": Player(1000, 1),
    "2": Player(2000, 2),
    "3": Player(4000, 3),
    "4": Player(500, 4),
}
players["0"].place_bet(100)
players["1"].place_bet(1000)
players["2"].place_bet(2000)
players["3"].place_bet(2000)
players["4"].place_bet(500)

players["0"].cards = ["AH", "AS"]
players["1"].cards = ["AC", "AD"]
players["2"].cards = ["KH", "KS"]
players["3"].cards = ["KD", "KC"]
players["4"].cards = ["QH", "QS"]

community_cards = ["2H", "3S", "6D", "9C", "7S"]


def distribute_chips(winning_order: list[list[int]]):
    pot = 0

    for place in winning_order:
        playersW = sorted([player_order[player] for player in place], key=lambda x: players[x].whole_bet)

        while playersW:
            playerW = playersW[0]

            if len([playerL for playerL in players.values() if playerL.whole_bet > 0]) == 0:
                break

            potMax = players[playerW].whole_bet

            for playerL in players.values():
                pot += min(potMax, playerL.whole_bet)
                playerL.whole_bet = max(0, playerL.whole_bet - potMax)

            for playerW in playersW:
                players[playerW].chips += pot // len(playersW)

            pot = 0
            playersW = [playerW for playerW in playersW if players[playerW].whole_bet > 0]

        if len([playerL for playerL in players.values() if playerL.whole_bet > 0]) == 0:
            break


def main():
    winning_order = arbiter({player: player.cards for player in players.values()}, community_cards)
    print(winning_order)

    distribute_chips(winning_order)
    print("Chips after distribution:")
    for player_id, player in players.items():
        print(f"Player {player_id}: {player.chips} chips")


if __name__ == "__main__":
    main()
