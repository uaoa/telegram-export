import { Calendar } from 'lucide-react';

export interface DateRange {
  from: Date | null;
  to: Date | null;
}

interface DateRangeSelectorProps {
  dateRange: DateRange;
  onChange: (range: DateRange) => void;
}

export function DateRangeSelector({ dateRange, onChange }: DateRangeSelectorProps) {
  const formatDateForInput = (date: Date | null): string => {
    if (!date) return '';
    return date.toISOString().split('T')[0];
  };

  const handleFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onChange({
      ...dateRange,
      from: value ? new Date(value) : null,
    });
  };

  const handleToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onChange({
      ...dateRange,
      to: value ? new Date(value + 'T23:59:59') : null,
    });
  };

  const setPreset = (days: number | 'all') => {
    if (days === 'all') {
      onChange({ from: null, to: null });
      return;
    }

    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - days);
    onChange({ from, to });
  };

  return (
    <div className="date-range-selector">
      <h4>
        <Calendar size={18} />
        Діапазон дат (опціонально)
      </h4>

      <div className="date-presets">
        <button
          type="button"
          className={`preset-btn ${!dateRange.from && !dateRange.to ? 'active' : ''}`}
          onClick={() => setPreset('all')}
        >
          Всі
        </button>
        <button
          type="button"
          className="preset-btn"
          onClick={() => setPreset(7)}
        >
          7 днів
        </button>
        <button
          type="button"
          className="preset-btn"
          onClick={() => setPreset(30)}
        >
          30 днів
        </button>
        <button
          type="button"
          className="preset-btn"
          onClick={() => setPreset(90)}
        >
          3 місяці
        </button>
        <button
          type="button"
          className="preset-btn"
          onClick={() => setPreset(365)}
        >
          1 рік
        </button>
      </div>

      <div className="date-inputs">
        <div className="date-input-group">
          <label htmlFor="dateFrom">Від</label>
          <input
            id="dateFrom"
            type="date"
            value={formatDateForInput(dateRange.from)}
            onChange={handleFromChange}
            max={formatDateForInput(dateRange.to || new Date())}
          />
        </div>

        <div className="date-input-group">
          <label htmlFor="dateTo">До</label>
          <input
            id="dateTo"
            type="date"
            value={formatDateForInput(dateRange.to)}
            onChange={handleToChange}
            min={formatDateForInput(dateRange.from)}
            max={formatDateForInput(new Date())}
          />
        </div>
      </div>

      {(dateRange.from || dateRange.to) && (
        <p className="date-hint">
          Буде експортовано повідомлення
          {dateRange.from && ` з ${dateRange.from.toLocaleDateString('uk-UA')}`}
          {dateRange.to && ` до ${dateRange.to.toLocaleDateString('uk-UA')}`}
        </p>
      )}
    </div>
  );
}
