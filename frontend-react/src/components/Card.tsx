type CardProps = {
  code: string; // e.g., "2H", "AS"
  className?: string;
};

const Card = ({ code, className = "" }: CardProps) => {
  return (
    <img
      src={`/cards/${code}.png`}
      alt={code}
      className={`w-12 h-auto ${className}`}
    />
  );
};

export default Card;
