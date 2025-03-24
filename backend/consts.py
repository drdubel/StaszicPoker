cards = [f"{rank}{suit}" for rank in "23456789TJQKA" for suit in "CDHS"]
cardValues = {rank: i + 2 for i, rank in enumerate("23456789TJQKA")}
handValues = {
    "HC": 0,
    "P": 1,
    "TP": 2,
    "TK": 3,
    "S": 4,
    "F": 5,
    "FH": 6,
    "FK": 7,
    "SF": 8,
    "RF": 9,
}
