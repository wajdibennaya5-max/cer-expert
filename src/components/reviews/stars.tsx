import { Icon } from "@/components/icons";

export function Stars({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-hidden="true">
      {[1, 2, 3, 4, 5].map((value) => (
        <Icon
          key={value}
          name="star"
          size={size}
          filled={value <= rating}
          className={value <= rating ? "text-volt-400" : "text-mist-300"}
        />
      ))}
    </span>
  );
}
