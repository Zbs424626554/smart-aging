import React, { useEffect, useRef, useState } from "react";
import { Dialog } from "antd-mobile";
import { ElderHealthService } from "../services/elderhealth.service";
import { AuthService } from "../services/auth.service";

// 归一化后的结构：同一药品可能有多次提醒
type Medication = { name: string; times: string[] };

// 全局用药提醒组件：登录后的老人用户，在任意页面都可弹出提醒
const MedicationReminder: React.FC = () => {
    const [medications, setMedications] = useState<Medication[]>([]);
    const medsRef = useRef<Medication[]>([]);
    const timerRef = useRef<number | null>(null);
    const isShowingRef = useRef(false);

    // 记录今天已提醒的 key，避免重复提醒
    const hasReminded = (name: string, time: string): boolean => {
        const today = new Date().toISOString().slice(0, 10);
        const key = `med_reminded_${today}_${time}_${name}`;
        return localStorage.getItem(key) === "1";
    };
    // 记录今日提醒，避免同一药品同一时间当日重复弹窗
    const markReminded = (name: string, time: string) => {
        const today = new Date().toISOString().slice(0, 10);
        const key = `med_reminded_${today}_${time}_${name}`;
        localStorage.setItem(key, "1");
    };

    useEffect(() => {
        // 仅在老人端登录时启用
        const user = AuthService.getCurrentUser();
        if (!user || user.role !== "elderly") return;

        let cancelled = false;

        const load = async (): Promise<void> => {
            try {
                const archive = await ElderHealthService.getMyArchive();
                if (!archive) {
                    if (!cancelled) setMedications([]);
                    return;
                }
                // 兼容旧结构：{name,time} 或 新结构：{name,times[]}
                const raw = (archive.useMedication || []) as any[];
                const map = new Map<string, Set<string>>();
                for (const it of raw) {
                    const nm = (it?.name || "").trim();
                    if (!nm) continue;
                    const set = map.get(nm) || new Set<string>();
                    if (Array.isArray(it?.times)) {
                        for (const t of it.times) if (t) set.add(String(t));
                    }
                    if (it?.time) set.add(String(it.time));
                    map.set(nm, set);
                }
                const normalized: Medication[] = Array.from(map.entries()).map(
                    ([name, set]) => ({ name, times: Array.from(set).sort() })
                );
                // 立即同步到 ref，方便后续立即轮询使用最新数据
                medsRef.current = normalized;
                if (!cancelled) setMedications(normalized);
            } catch {
                // ignore errors
            }
        };
        load();

        // 监听来自服务的档案更新事件，立即刷新用药列表以无需刷新页面
        const handleArchiveUpdated = async () => {
            await load();
            // 立刻检查一次是否到点
            poll();
        };
        window.addEventListener("elderhealth:archiveUpdated", handleArchiveUpdated as EventListener);

        // 定时刷新档案（防止后台更新后错过提醒），每5分钟刷新一次列表
        const refreshId = window.setInterval(load, 5 * 60 * 1000);

        // 轮询检测是否到点，10秒一次
        const beep = (durationMs = 400, frequency = 880) => {
            try {
                const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
                if (!Ctx) return;
                const ctx = new Ctx();
                const o = ctx.createOscillator();
                const g = ctx.createGain();
                o.type = "sine";
                o.frequency.value = frequency;
                o.connect(g);
                g.connect(ctx.destination);
                o.start();
                g.gain.setValueAtTime(0.001, ctx.currentTime);
                g.gain.exponentialRampToValueAtTime(0.5, ctx.currentTime + 0.02);
                g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationMs / 1000);
                o.stop(ctx.currentTime + durationMs / 1000 + 0.01);
            } catch {
                // ignore
            }
        };

        const speak = (text: string) => {
            try {
                const synth = (window as any).speechSynthesis as SpeechSynthesis | undefined;
                if (!synth) return;
                synth.cancel();
                const utter = new SpeechSynthesisUtterance(text);
                utter.lang = "zh-CN";
                utter.rate = 1;
                synth.speak(utter);
            } catch {
                // ignore speech errors
            }
        };

        const poll = () => {
            medsRef.current = medications; // 始终使用最新数据
            const now = new Date();
            const hh = String(now.getHours()).padStart(2, "0");
            const mm = String(now.getMinutes()).padStart(2, "0");
            const current = `${hh}:${mm}`;

            const duePairs: Array<{ name: string; time: string }> = [];
            for (const m of medsRef.current) {
                for (const t of m.times || []) {
                    const tt = String(t);
                    if (tt === current && !hasReminded(m.name, tt)) {
                        duePairs.push({ name: m.name, time: tt });
                    }
                }
            }

            if (duePairs.length === 0 || isShowingRef.current) return;

            isShowingRef.current = true;
            Dialog.alert({
                content: (
                    <div style={{ fontSize: 18, lineHeight: 1.6 }}>
                        <div style={{ fontWeight: 700, marginBottom: 8 }}>到达用药时间</div>
                        <div>请按时服药：</div>
                        <ul style={{ margin: "6px 0 0", paddingLeft: 22, listStyleType: 'disc' }}>
                            {duePairs.map((d, idx) => (
                                <li key={idx} style={{ margin: "4px 10px" }}>{d.name}（{d.time}）</li>
                            ))}
                        </ul>
                    </div>
                ),
                closeOnMaskClick: true,
                onClose: () => {
                    // 关闭时标记今日已提醒，防止当日重复
                    duePairs.forEach((d) => markReminded(d.name, d.time));
                    isShowingRef.current = false;
                },
            });

            // 声音提示 + 语音播报
            beep();
            const names = Array.from(new Set(duePairs.map((d) => d.name))).join("、");
            speak(`现在是北京时间${current}，到达用药时间，请服用：${names}。`);
        };

        timerRef.current = window.setInterval(poll, 10000);
        // 立即执行一次，避免刚添加用药时间时需要等待下一轮轮询
        poll();

        return () => {
            cancelled = true;
            if (timerRef.current) window.clearInterval(timerRef.current);
            window.clearInterval(refreshId);
            window.removeEventListener("elderhealth:archiveUpdated", handleArchiveUpdated as EventListener);
        };
    }, [medications.length]);

    return null;
};

export default MedicationReminder;

