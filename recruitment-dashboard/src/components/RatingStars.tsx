export default function RatingStars({
  rating,
  onChange,
}: {
  rating: number;
  onChange?: (r: number) => void;
}) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange?.(star)}
          disabled={!onChange}
          className={`text-lg ${star <= rating ? "text-yellow-400" : "text-gray-300"} ${
            onChange ? "cursor-pointer hover:text-yellow-500" : "cursor-default"
          }`}
        >
          ★
        </button>
      ))}
    </div>
  );
}
