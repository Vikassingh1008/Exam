import React from 'react';

const QuestionCard = ({ questionNumber, questionText, options, selectedOption, onSelect }) => (
  <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm transition-colors duration-200">
    <div className="border-b border-slate-100 dark:border-slate-800 px-5 py-4 sm:px-7 transition-colors duration-200">
      <span className="inline-flex rounded-md bg-blue-50 dark:bg-blue-900/30 px-2.5 py-1 text-xs font-bold text-blue-700 dark:text-blue-400">
        Question {questionNumber}
      </span>
      <h2 className="mt-4 text-lg font-semibold leading-8 text-slate-800 dark:text-slate-100 sm:text-xl">
        {questionText}
      </h2>
    </div>
    <div className="space-y-3 p-5 sm:p-7">
      {options.map((option, index) => {
        const isSelected = selectedOption === index;
        return (
          <button 
            key={index} 
            onClick={() => onSelect(index)} 
            className={`flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-colors duration-200 ${
              isSelected 
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-500' 
                : 'border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-slate-50 dark:hover:bg-slate-800/50'
            }`}
          >
            <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors duration-200 ${
              isSelected 
                ? 'bg-blue-600 text-white' 
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}>
              {String.fromCharCode(65 + index)}
            </span>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300 sm:text-base transition-colors duration-200">
              {option.text}
            </span>
          </button>
        );
      })}
    </div>
  </section>
);

export default QuestionCard;
