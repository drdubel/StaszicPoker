from backend.data.consts import cardValues


def is_royale_flush(values: list[int], suits: list[str]):
    for i in range(3):
        if values[i : i + 5] == tuple(range(values[0], values[0] - 5, -1)):
            if len(set(suits[i : i + 5])) == 1:
                if values[i] - 4 == 10:
                    return True

    return False


def is_straight_flush(values: list[int], suits: list[str]):
    for i in range(3):
        if values[i : i + 5] == tuple(range(values[0], values[0] - 5, -1)):
            if len(set(suits[i : i + 5])) == 1:
                return True, values[i] - 4

    return False


def is_four_of_a_kind(values: list[int]):
    for value in values:
        if values.count(value) == 4:
            return True, value, max([x for x in values if x != value])

    return False


def is_full_house(values: list[int]):
    for value in values:
        if values.count(value) == 3:
            for value2 in values:
                if value2 == value:
                    continue

                if values.count(value2) == 3:
                    return True, max(value, value2), min(value, value2)

                elif values.count(value2) == 2:
                    return True, value, value2

    return False


def is_flush(values: list[int], suits: list[str]):
    for suit in suits:
        if suits.count(suit) == 5:
            for i, suit2 in enumerate(suits):
                if suit2 == suit:
                    continue

                values[i] = 0

            return True, sorted(values, reverse=True)[:5]

    return False


def is_straight(values: list[int]):
    for i in range(3):
        if values[i : i + 5] == tuple(range(values[0], values[0] - 5, -1)):
            return True, values[i] - 4

    return False


def is_three_of_a_kind(values: list[int]):
    for value in values:
        if values.count(value) == 3:
            return True, value, sorted([x for x in values if x != value], reverse=True)[:2]

    return False


def is_two_pair(values: list[int]):
    pairs = []

    for value in values:
        if values.count(value) == 2 and value not in pairs:
            pairs.append(value)

    if len(pairs) >= 2:
        pairs = sorted(pairs, reverse=True)

        return True, pairs[0], pairs[1], max([x for x in values if x not in pairs[:2]])

    return False


def is_pair(values: list[int]):
    for value in values:
        if values.count(value) == 2:
            return True, value, sorted([x for x in values if x != value], reverse=True)[:3]

    return False


def evaluate_hand(cards: list[str]):
    cards = [(cardValues[card[0]], card[1]) for card in cards]
    cards = sorted(cards, reverse=True)
    values, suits = zip(*cards)

    royale_flush = is_royale_flush(values, suits)
    if royale_flush:
        return 9

    straight_flush = is_straight_flush(values, suits)
    if straight_flush:
        return 8, [straight_flush[1]]

    four_of_a_kind = is_four_of_a_kind(values)
    if four_of_a_kind:
        return 7, [four_of_a_kind[1], four_of_a_kind[2]]

    full_house = is_full_house(values)
    if full_house:
        return 6, [full_house[1], full_house[2]]

    flush = is_flush(list(values), suits)
    if flush:
        return 5, flush[1]

    straight = is_straight(values)
    if straight:
        return 4, [straight[1]]

    three_of_a_kind = is_three_of_a_kind(values)
    if three_of_a_kind:
        return 3, [three_of_a_kind[1], *three_of_a_kind[2][0]]

    two_pair = is_two_pair(values)
    if two_pair:
        return 2, [two_pair[1], two_pair[2], two_pair[3]]

    pair = is_pair(values)
    if pair:
        return 1, [pair[1], *pair[2]]

    return 0, sorted(values, reverse=True)[:5]


def arbiter(playerCards: dict[str, list[str]], communityCards: list[str]):
    hands: list[tuple[int, list[int]]] = [evaluate_hand(cards + communityCards) for cards in playerCards.values()]
    hand_order: list[int, int] = []
    places: list[list[int]] = []

    for i, hand in enumerate(hands):
        hand_order.append((hand, i))

    hand_order.sort(key=lambda x: (x[0][0], x[0][1:]), reverse=True)

    prev_hand = [0, 0]
    for hand, i in hand_order:
        if hand == prev_hand:
            places[-1].append(i)

        else:
            places.append([i])

        prev_hand = hand

    hand_order = [x[1] for x in hand_order]

    return places
