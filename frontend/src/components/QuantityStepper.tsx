export function QuantityStepper({
  quantity,
  onDecrease,
  onIncrease,
}: {
  quantity: number;
  onDecrease: () => void;
  onIncrease: (target?: HTMLElement | null) => void;
}) {
  return (
    <div className="quantity-stepper">
      <button type="button" onClick={onDecrease}>-</button>
      <span>{quantity}</span>
      <button type="button" onClick={(event) => onIncrease(event.currentTarget)}>+</button>
    </div>
  );
}
