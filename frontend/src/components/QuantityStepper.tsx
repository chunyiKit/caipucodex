import { memo } from 'react';
import { Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

function QuantityStepperComponent({
  quantity,
  onDecrease,
  onIncrease,
}: {
  quantity: number;
  onDecrease: () => void;
  onIncrease: (target?: HTMLElement | null) => void;
}) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-[var(--surface-secondary)] p-1">
      <Button
        variant="ghost"
        size="icon"
        className="w-8 h-8 rounded-full hover:bg-white"
        onClick={onDecrease}
      >
        <Minus size={14} />
      </Button>
      <span className="min-w-[24px] text-center font-semibold text-sm">{quantity}</span>
      <Button
        variant="ghost"
        size="icon"
        className="w-8 h-8 rounded-full hover:bg-white"
        onClick={(event) => onIncrease(event.currentTarget)}
      >
        <Plus size={14} />
      </Button>
    </div>
  );
}

export const QuantityStepper = memo(QuantityStepperComponent, (prev, next) => prev.quantity === next.quantity);
