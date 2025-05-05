cards = [f"{rank}{suit}" for rank in "23456789TJQKA" for suit in "CDHS"]
cardValues = {rank: i for i, rank in enumerate("0123456789TJQKA")}
