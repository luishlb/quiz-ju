import { QuizFlow } from "@/components/quiz/QuizFlow";
import { JuMascot } from "@/components/ui/JuMascot";

export default function QuizPage() {
  return (
    <>
      <QuizFlow />
      {/* Bonequinho assistindo no canto. Botão de música fica em bottom-right. */}
      <div className="fixed bottom-3 left-3 z-40">
        <JuMascot mood="feliz" size="sm" />
      </div>
    </>
  );
}
