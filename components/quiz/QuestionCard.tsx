"use client";

import type { Question } from "@/data/questions";

type Props = {
  question: Question;
  value: string;
  onChange: (v: string) => void;
};

/**
 * Renderiza uma pergunta + o input apropriado pro tipo dela.
 * Não decide se está correta — só captura o valor.
 */
export function QuestionCard({ question, value, onChange }: Props) {
  return (
    <div className="bg-white/85 backdrop-blur-sm border-4 border-rosa-bubble rounded-2xl p-6 sm:p-8 shadow-[6px_6px_0_rgba(199,125,255,0.4)] flex flex-col gap-6">
      <h2 className="font-display text-rosa-choque text-2xl sm:text-3xl leading-snug">
        {question.prompt}
      </h2>

      {question.type === "multiple" && (
        <MultipleChoiceInput
          options={question.options}
          value={value}
          onChange={onChange}
        />
      )}

      {question.type === "short" && (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="digite sua resposta..."
          autoComplete="off"
          spellCheck={false}
          maxLength={120}
          className="bg-white border-2 border-rosa-bubble rounded-xl px-4 py-3 font-display text-lg text-preto-revista placeholder:text-preto-revista/30 focus:outline-none focus:border-rosa-choque focus:shadow-[0_0_0_4px_rgba(255,105,180,0.25)] transition-all"
        />
      )}

      {question.type === "open-short" && (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="manda sua resposta..."
          autoComplete="off"
          maxLength={120}
          className="bg-white border-2 border-lilas rounded-xl px-4 py-3 font-display text-lg text-preto-revista placeholder:text-preto-revista/30 focus:outline-none focus:border-rosa-choque focus:shadow-[0_0_0_4px_rgba(199,125,255,0.25)] transition-all"
        />
      )}

      {question.type === "open-long" && (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="escreve sem pressa..."
          maxLength={500}
          rows={5}
          className="bg-white border-2 border-lilas rounded-xl px-4 py-3 font-body text-base text-preto-revista placeholder:text-preto-revista/30 focus:outline-none focus:border-rosa-choque focus:shadow-[0_0_0_4px_rgba(199,125,255,0.25)] transition-all resize-none"
        />
      )}

      {question.type === "open-long" || question.type === "open-short" ? (
        <p className="text-xs font-display text-preto-revista/60 text-center -mt-2">
          (essa não pontua — vai pro mural da festa 💌)
        </p>
      ) : null}
    </div>
  );
}

function MultipleChoiceInput({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  const selected = Number.parseInt(value, 10);
  return (
    <div className="flex flex-col gap-3">
      {options.map((opt, idx) => {
        const isSelected = selected === idx;
        return (
          <button
            key={idx}
            type="button"
            onClick={() => onChange(String(idx))}
            className={[
              "text-left font-display text-base sm:text-lg px-5 py-3 rounded-xl border-2 transition-all",
              isSelected
                ? "bg-rosa-choque text-white border-rosa-choque shadow-[3px_3px_0_rgba(0,0,0,0.2)] scale-[1.02]"
                : "bg-white text-preto-revista border-rosa-bubble hover:border-rosa-choque hover:shadow-[2px_2px_0_rgba(255,20,147,0.3)]",
            ].join(" ")}
          >
            <span className="font-bubble text-sm mr-2 opacity-70">
              {String.fromCharCode(65 + idx)}.
            </span>
            {opt}
          </button>
        );
      })}
    </div>
  );
}
