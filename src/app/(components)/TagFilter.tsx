"use client";
import { useState, useRef, useEffect } from "react";
import { X, Filter, ChevronDown, Check } from "lucide-react";

interface Tag {
  id: string;
  name: string;
}

interface TagFilterProps {
  tags: Tag[];
  selectedTags: string[];
  onTagToggle: (tagId: string) => void;
  onClearAll: () => void;
}

export default function TagFilter({ tags, selectedTags, onTagToggle, onClearAll }: TagFilterProps) {
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

  const selectedTagsData = selectedTags.map(tagId => tags.find(t => t.id === tagId)).filter(Boolean);

  return (
    <div className="mb-0">
      {/* Tags sélectionnés */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {selectedTagsData.map(tag => (
            <span
              key={tag!.id}
              className="inline-flex items-center gap-1 px-3 py-1 bg-primary text-primary-foreground text-sm rounded-full"
            >
              {tag!.name}
              <button
                onClick={() => onTagToggle(tag!.id)}
                className="hover:bg-primary-foreground/20 rounded-full p-0.5 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Menu déroulant avec titre intégré */}
      <div className="relative inline-block" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full sm:w-auto min-w-[160px] flex items-center justify-between px-3 py-2 border border-border rounded-lg bg-background hover:bg-accent hover:text-accent-foreground transition-colors text-sm"
        >
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            <span className="font-medium">
              {selectedTags.length === 0 
                ? "Filtrer par tag" 
                : `${selectedTags.length} tag${selectedTags.length > 1 ? 's' : ''} sélectionné${selectedTags.length > 1 ? 's' : ''}`
              }
            </span>
          </div>
          <div className="flex items-center gap-2">
            {selectedTags.length > 0 && (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  onClearAll();
                }}
                className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-muted transition-colors cursor-pointer"
                title="Effacer tout"
              >
                <X className="w-3 h-3" />
              </div>
            )}
            <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </div>
        </button>

        {/* Dropdown menu */}
        {isOpen && (
          <div className="absolute top-full left-0 mt-1 bg-background border border-border rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto min-w-[160px] w-max">
            {tags.length === 0 ? (
              <div className="px-4 py-3 text-sm text-muted-foreground text-center">
                Aucun tag disponible
              </div>
            ) : (
              <div className="py-1">
                {tags.map(tag => (
                  <button
                    key={tag.id}
                    onClick={() => {
                      onTagToggle(tag.id);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    <div className="flex items-center justify-center w-4 h-4">
                      {selectedTags.includes(tag.id) && (
                        <Check className="w-4 h-4 text-primary" />
                      )}
                    </div>
                    <span className="flex-1 text-left">{tag.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
