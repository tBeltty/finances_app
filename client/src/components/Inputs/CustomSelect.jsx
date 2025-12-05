import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Plus } from 'lucide-react';

export default function CustomSelect({
    value,
    onChange,
    options,
    placeholder = "Seleccionar...",
    icon: Icon
}) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    const selectedOption = options.find(opt => opt.value === value);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (optionValue) => {
        onChange(optionValue);
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={containerRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full bg-surface-container border ${isOpen ? 'border-primary ring-2 ring-primary/20' : 'border-outline'} rounded-xl px-4 py-2.5 text-left flex items-center justify-between transition-all hover:bg-surface-container-high`}
            >
                <span className={`block truncate ${selectedOption ? 'text-on-surface' : 'text-on-surface-variant'}`}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <ChevronDown className={`w-4 h-4 text-on-surface-variant transition-transform duration-200 ${isOpen ? 'rotate-180 text-primary' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute z-[100] w-full mt-2 glass-dropdown border border-outline rounded-xl shadow-2xl max-h-60 overflow-auto animate-in fade-in zoom-in-95 duration-100 origin-top scrollbar-thin scrollbar-thumb-outline scrollbar-track-transparent">
                    <div className="p-1 space-y-0.5">
                        {options.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => handleSelect(option.value)}
                                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors ${value === option.value
                                    ? 'bg-primary/20 text-primary'
                                    : 'text-on-surface-variant hover:bg-surface hover:text-on-surface'
                                    }`}
                            >
                                <span className="flex items-center gap-2 truncate">
                                    {option.icon && <option.icon className="w-4 h-4 opacity-70" />}
                                    {option.label}
                                </span>
                                {value === option.value && <Check className="w-3.5 h-3.5" />}
                            </button>
                        ))}

                        {/* Separator if needed, but for now just list options */}
                    </div>
                </div>
            )}
        </div>
    );
}
