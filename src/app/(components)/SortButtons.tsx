"use client";
import { MapPin, Clock, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export type SortOption = "distance" | "date";

interface SortButtonsProps {
  currentSort: SortOption;
  onSortChange: (sort: SortOption) => void;
  hasLocation: boolean;
}

export default function SortButtons({ currentSort, onSortChange, hasLocation }: SortButtonsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fermer le dropdown quand on clique à l'extérieur
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const sortOptions = [
    {
      value: "date" as SortOption,
      label: "Plus récent",
      icon: Clock,
      description: "Trier par date de publication"
    },
    {
      value: "distance" as SortOption,
      label: "Plus proche",
      icon: MapPin,
      description: "Trier par distance (nécessite la géolocalisation)",
      disabled: !hasLocation
    }
  ];

  const currentOption = sortOptions.find(option => option.value === currentSort);

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full sm:w-auto min-w-[160px] flex items-center justify-between px-3 py-2 border border-border rounded-lg bg-background hover:bg-accent hover:text-accent-foreground transition-colors text-sm"
      >
        <div className="flex items-center gap-2">
          {currentOption && <currentOption.icon className="w-4 h-4" />}
          <span className="font-medium">{currentOption?.label}</span>
        </div>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

        {/* Dropdown menu */}
        {isOpen && (
          <div className="absolute top-full left-0 mt-1 bg-background border border-border rounded-lg shadow-lg z-50 min-w-[160px] w-max">
          <div className="py-1">
            {sortOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  if (!option.disabled) {
                    onSortChange(option.value);
                    setIsOpen(false);
                  }
                }}
                disabled={option.disabled}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
                  option.disabled
                    ? 'text-muted-foreground cursor-not-allowed opacity-50'
                    : currentSort === option.value
                    ? 'bg-accent text-accent-foreground'
                    : 'hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                <option.icon className="w-4 h-4" />
                <div className="flex-1 text-left">
                  <div className="font-medium">{option.label}</div>
                  <div className="text-xs text-muted-foreground">{option.description}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
