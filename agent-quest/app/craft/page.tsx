"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AVATARS,
  PERSONAS,
  SKILLS,
  MAX_SKILL_SLOTS,
  RANDOM_NAMES,
} from "@/lib/presets";
import type { AgentSpec } from "@/lib/types";

type Step = "avatar" | "persona" | "skills" | "name" | "hatch";
const STEPS: Step[] = ["avatar", "persona", "skills", "name", "hatch"];

const STEP_TITLES: Record<Step, { title: string; sub: string }> = {
  avatar: { title: "たまごをえらぼう", sub: "どの子をそだてる？" },
  persona: { title: "せいかくをきめよう", sub: "話し方が変わるよ" },
  skills: { title: "スキルをそうびしよう", sub: `${MAX_SKILL_SLOTS}つまでえらべる` },
  name: { title: "なまえをつけよう", sub: "あとから変えられないよ（プロトタイプ）" },
  hatch: { title: "", sub: "" },
};

export default function CraftPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("avatar");
  const [avatarId, setAvatarId] = useState<string>(AVATARS[0].id);
  const [personaId, setPersonaId] = useState<string>(PERSONAS[0].id);
  const [kansai, setKansai] = useState(false);
  const [emoji, setEmoji] = useState(true);
  const [skills, setSkills] = useState<string[]>(["web_search"]);
  const [name, setName] = useState("");
  const [hatched, setHatched] = useState(false);

  const stepIndex = STEPS.indexOf(step);
  const avatar = AVATARS.find((a) => a.id === avatarId)!;

  const toggleSkill = (id: string) => {
    setSkills((prev) =>
      prev.includes(id)
        ? prev.filter((s) => s !== id)
        : prev.length < MAX_SKILL_SLOTS
          ? [...prev, id]
          : prev,
    );
  };

  const startHatch = () => {
    const spec: AgentSpec = {
      name: name.trim() || RANDOM_NAMES[0],
      avatarId,
      personaId,
      kansai,
      emoji,
      skills,
    };
    localStorage.setItem("agent-quest:spec", JSON.stringify(spec));
    localStorage.removeItem("agent-quest:progress");
    setStep("hatch");
    setTimeout(() => setHatched(true), 1600);
  };

  return (
    <main className="flex min-h-dvh flex-col px-6 pb-8 pt-6">
      {step !== "hatch" && (
        <>
          {/* 進行ドット */}
          <div className="mb-6 flex justify-center gap-2">
            {STEPS.slice(0, 4).map((s, i) => (
              <div
                key={s}
                className={`h-2.5 rounded-full transition-all ${
                  i <= stepIndex ? "w-8 bg-coral" : "w-2.5 bg-ink/15"
                }`}
              />
            ))}
          </div>
          <h1 className="text-center text-2xl font-extrabold">
            {STEP_TITLES[step].title}
          </h1>
          <p className="mt-1 text-center text-sm opacity-60">
            {STEP_TITLES[step].sub}
          </p>
        </>
      )}

      <div className="mt-6 flex-1">
        {step === "avatar" && (
          <div className="grid grid-cols-2 gap-4">
            {AVATARS.map((a) => (
              <button
                key={a.id}
                onClick={() => setAvatarId(a.id)}
                className={`anim-pop flex flex-col items-center gap-2 rounded-3xl border-4 bg-white p-6 shadow-md transition active:scale-95 ${
                  avatarId === a.id ? "border-coral" : "border-transparent"
                }`}
              >
                <span className="text-6xl">{a.emoji}</span>
                <span className="font-bold">{a.name}</span>
              </button>
            ))}
          </div>
        )}

        {step === "persona" && (
          <div className="flex flex-col gap-3">
            {PERSONAS.map((p) => (
              <button
                key={p.id}
                onClick={() => setPersonaId(p.id)}
                className={`anim-pop flex items-center gap-4 rounded-3xl border-4 bg-white p-4 text-left shadow-md transition active:scale-95 ${
                  personaId === p.id ? "border-coral" : "border-transparent"
                }`}
              >
                <span className="text-4xl">{p.emoji}</span>
                <span>
                  <span className="block text-lg font-extrabold">{p.label}</span>
                  <span className="block text-xs opacity-60">{p.desc}</span>
                </span>
              </button>
            ))}
            <div className="mt-2 flex gap-3">
              <Toggle label="関西弁" on={kansai} onChange={setKansai} />
              <Toggle label="絵文字たっぷり" on={emoji} onChange={setEmoji} />
            </div>
          </div>
        )}

        {step === "skills" && (
          <div className="flex flex-col gap-3">
            {/* 装備スロット表示 */}
            <div className="mb-2 flex justify-center gap-3">
              {Array.from({ length: MAX_SKILL_SLOTS }).map((_, i) => {
                const skill = SKILLS.find((s) => s.id === skills[i]);
                return (
                  <div
                    key={i}
                    className={`flex h-16 w-16 items-center justify-center rounded-2xl border-4 border-dashed text-3xl ${
                      skill
                        ? "anim-pop border-mint bg-white"
                        : "border-ink/20 bg-ink/5"
                    }`}
                  >
                    {skill?.emoji ?? ""}
                  </div>
                );
              })}
            </div>
            {SKILLS.map((s) => {
              const equipped = skills.includes(s.id);
              return (
                <button
                  key={s.id}
                  onClick={() => toggleSkill(s.id)}
                  className={`flex items-center gap-4 rounded-3xl border-4 bg-white p-4 text-left shadow-md transition active:scale-95 ${
                    equipped ? "border-mint" : "border-transparent"
                  }`}
                >
                  <span className="text-4xl">{s.emoji}</span>
                  <span className="flex-1">
                    <span className="flex items-center gap-2 text-lg font-extrabold">
                      {s.name}
                      {s.recommended && (
                        <span className="rounded-full bg-sun px-2 py-0.5 text-[10px] font-bold">
                          クエスト推奨
                        </span>
                      )}
                    </span>
                    <span className="block text-xs opacity-60">{s.desc}</span>
                  </span>
                  <span className="text-sm font-bold text-mint">
                    {equipped ? "そうび中" : ""}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {step === "name" && (
          <div className="flex flex-col items-center gap-6">
            <span className="anim-float text-7xl">{avatar.emoji}</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 10))}
              placeholder="なまえ（10文字まで）"
              className="w-full rounded-2xl border-4 border-ink/10 bg-white p-4 text-center text-xl font-bold outline-none focus:border-coral"
            />
            <button
              onClick={() =>
                setName(
                  RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)],
                )
              }
              className="rounded-full bg-sky/30 px-6 py-2 text-sm font-bold transition active:scale-95"
            >
              🎲 おまかせ
            </button>
          </div>
        )}

        {step === "hatch" && (
          <div className="flex h-full flex-col items-center justify-center gap-6 pt-20 text-center">
            {!hatched ? (
              <>
                <span className="anim-wiggle inline-block text-8xl">🥚</span>
                <p className="text-lg font-bold opacity-70">
                  なにかが生まれそう…！
                </p>
              </>
            ) : (
              <>
                <div className="relative">
                  <span className="anim-pop inline-block text-8xl">
                    {avatar.emoji}
                  </span>
                  <span className="absolute -right-6 -top-4 text-3xl">✨</span>
                  <span className="absolute -left-6 top-6 text-2xl">✨</span>
                </div>
                <div className="anim-pop">
                  <p className="text-2xl font-extrabold">
                    「{name.trim() || RANDOM_NAMES[0]}」がうまれた！
                  </p>
                  <p className="mt-2 text-sm opacity-60">
                    はじめてのクエストがまってるよ
                  </p>
                </div>
                <button
                  onClick={() => router.push("/play")}
                  className="anim-pop rounded-full bg-coral px-12 py-4 text-xl font-extrabold text-white shadow-lg shadow-coral/40 transition active:scale-95"
                >
                  ぼうけんに出発！
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {step !== "hatch" && (
        <div className="mt-6 flex gap-3">
          {stepIndex > 0 && (
            <button
              onClick={() => setStep(STEPS[stepIndex - 1])}
              className="rounded-full bg-ink/10 px-6 py-4 font-bold transition active:scale-95"
            >
              もどる
            </button>
          )}
          <button
            onClick={() =>
              step === "name" ? startHatch() : setStep(STEPS[stepIndex + 1])
            }
            disabled={step === "skills" && skills.length === 0}
            className="flex-1 rounded-full bg-coral py-4 text-lg font-extrabold text-white shadow-lg shadow-coral/40 transition active:scale-95 disabled:opacity-40"
          >
            {step === "name" ? "たんじょう！" : "つぎへ"}
          </button>
        </div>
      )}
    </main>
  );
}

function Toggle({
  label,
  on,
  onChange,
}: {
  label: string;
  on: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!on)}
      className={`flex-1 rounded-2xl border-4 p-3 text-sm font-bold transition active:scale-95 ${
        on ? "border-coral bg-coral/10" : "border-ink/10 bg-white"
      }`}
    >
      {on ? "✅ " : ""}
      {label}
    </button>
  );
}
