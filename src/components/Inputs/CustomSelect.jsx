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
                className={`w-full bg-slate-900/50 border ${isOpen ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-slate-600'} rounded-xl px-4 py-2.5 text-left flex items-center justify-between transition-all hover:bg-slate-800/50`}
            >
                <span className={`block truncate ${selectedOption ? 'text-slate-200' : 'text-slate-500'}`}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${isOpen ? 'rotate-180 text-indigo-400' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute z-50 w-full mt-2 bg-slate-900/95 backdrop-blur-xl border border-slate-700 rounded-xl shadow-2xl max-h-60 overflow-auto animate-in fade-in zoom-in-95 duration-100 origin-top scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                    <div className="p-1 space-y-0.5">
                        {options.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => handleSelect(option.value)}
                                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors ${value === option.value
                                        ? 'bg-indigo-600/20 text-indigo-300'
                                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
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
